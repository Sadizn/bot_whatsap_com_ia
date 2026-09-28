import { musicService } from '../../services/musicService.js';
import { PERMISSIONS } from '../../modules/permissionManager.js';

export const ytmp4Command = {
  name: 'ytmp4',
  aliases: ['video', 'baixarvideo'],
  category: 'music',
  description: 'Obtém informações e vídeo MP4 do YouTube',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, rawArgs }) {
    if (!rawArgs || !rawArgs.trim()) {
      await sock.sendMessage(remoteJid, {
        text: '🎬 *Como usar*: !ytmp4 <link ou nome do vídeo>\n_Exemplo: !ytmp4 Imagine Dragons Believer_'
      }, { quoted: msg });
      return;
    }

    try {
      const track = await musicService.searchAndResolve(rawArgs);

      let caption = `╭───────────────╮\n`;
      caption += `│ ❖ 𝐘𝐎𝐔𝐓𝐔𝐁𝐄 𝐕𝐈́𝐃𝐄𝐎 ❖\n`;
      caption += `│ ✰ ❯ 𝐓𝐢́𝐭𝐮𝐥𝐨: ${track.title}\n`;
      caption += `│ ✰ ❯ 𝐂𝐚𝐧𝐚𝐥: ${track.artist}\n`;
      caption += `│ ✰ ❯ 𝐃𝐮𝐫𝐚𝐜̧𝐚̃𝐨: ${track.duration}\n`;
      caption += `│ ✰ ❯ 𝐕𝐢𝐬𝐮𝐚𝐥𝐢𝐳𝐚𝐜̧𝐨̃𝐞𝐬: ${track.views}\n`;
      caption += `│ ✰ ❯ 𝐋𝐢𝐧𝐤: ${track.url}\n`;
      caption += `╰───────────────╯\n`;
      caption += `🎬 _Para assistir ou baixar em HD, acesse o link acima._`;

      if (track.thumbnail) {
        await sock.sendMessage(remoteJid, {
          image: { url: track.thumbnail },
          caption
        }, { quoted: msg });
      } else {
        await sock.sendMessage(remoteJid, { text: caption }, { quoted: msg });
      }
    } catch (err) {
      await sock.sendMessage(remoteJid, {
        text: `❌ Falha ao buscar vídeo no YouTube: ${err.message}`
      }, { quoted: msg });
    }
  }
};
