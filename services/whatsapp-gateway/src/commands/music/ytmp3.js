import { musicService } from '../../services/musicService.js';
import { PERMISSIONS } from '../../modules/permissionManager.js';

export const ytmp3Command = {
  name: 'ytmp3',
  aliases: ['mp3', 'baixarmp3'],
  category: 'music',
  description: 'Baixa o áudio MP3 de um vídeo ou link do YouTube com capa',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, rawArgs }) {
    if (!rawArgs || !rawArgs.trim()) {
      await sock.sendMessage(remoteJid, {
        text: '🎵 *Como usar*: !ytmp3 <link do YouTube ou nome>\n_Exemplo: !ytmp3 https://youtube.com/watch?v=..._'
      }, { quoted: msg });
      return;
    }

    try {
      const track = await musicService.searchAndResolve(rawArgs);

      let caption = `╭───────────────╮\n`;
      caption += `│ ❖ 𝐘𝐎𝐔𝐓𝐔𝐁𝐄 𝐌𝐏𝟑 ❖\n`;
      caption += `│ ✰ ❯ 𝐓𝐢́𝐭𝐮𝐥𝐨: ${track.title}\n`;
      caption += `│ ✰ ❯ 𝐀𝐫𝐭𝐢𝐬𝐭𝐚: ${track.artist}\n`;
      caption += `│ ✰ ❯ 𝐃𝐮𝐫𝐚𝐜̧𝐚̃𝐨: ${track.duration}\n`;
      caption += `╰───────────────╯`;

      if (track.thumbnail) {
        await sock.sendMessage(remoteJid, {
          image: { url: track.thumbnail },
          caption
        }, { quoted: msg });
      }

      if (track.audioUrl) {
        await sock.sendMessage(remoteJid, {
          audio: { url: track.audioUrl },
          mimetype: 'audio/mp4',
          ptt: false
        }, { quoted: msg });
      } else {
        await sock.sendMessage(remoteJid, {
          text: `❌ Não foi possível baixar o áudio de "${rawArgs}".`
        }, { quoted: msg });
      }
    } catch (err) {
      await sock.sendMessage(remoteJid, {
        text: `❌ Falha ao processar download do YouTube: ${err.message}`
      }, { quoted: msg });
    }
  }
};
