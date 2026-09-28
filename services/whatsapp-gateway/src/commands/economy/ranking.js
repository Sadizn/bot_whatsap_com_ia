import { PERMISSIONS } from '../../modules/permissionManager.js';
import { economyService } from '../../modules/economyService.js';
import { userStore } from '../../modules/userStore.js';

export const rankingCommand = {
  name: 'ranking',
  aliases: ['top', 'rank', 'leaderboard', 'topxp', 'ricos'],
  category: 'economy',
  description: 'Exibe o ranking semanal de XP (Segunda a Sábado - Reseta toda semana)',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, senderJid, activePrefix }) {
    const p = activePrefix || '!';
    const { top, totalUsers, callerRank, isSunday, seasonTitle } = economyService.getLeaderboard(10, senderJid);

    if (top.length === 0) {
      return sock.sendMessage(
        remoteJid,
        { text: `📊 Ainda não existem usuários cadastrados no ranking!\nUse *${p}cad* para iniciar.` },
        { quoted: msg }
      );
    }

    const medals = ['🥇', '🥈', '🥉', '🏅', '🏅', '🏅', '🏅', '🏅', '🏅', '🏅'];

    let lines = [];
    lines.push(`╭───────────────╮`);
    lines.push(`│ ❖ ${seasonTitle} ❖`);
    lines.push(`│ 📅 ❯ 𝐂𝐢𝐜𝐥𝐨: Seg a Sáb (Domingo folga)`);
    lines.push(`│ 🔄 ❯ 𝐑𝐞𝐢𝐧𝐢́𝐜𝐢𝐨: Toda Segunda 00:00`);
    lines.push(`╰───────────────╯\n`);

    top.forEach((u, i) => {
      const medal = medals[i] || '🏅';
      const pos = `${i + 1}º`.padEnd(3, ' ');
      const name = u.name || `@${u.jid.split('@')[0]}`;
      const weeklyScore = (u.weeklyXpAmount || 0).toLocaleString('pt-BR');
      const totalXp = (u.xp || 0).toLocaleString('pt-BR');
      lines.push(`${medal} *${pos}* ${name} ❯ *${weeklyScore} XP nesta semana* _(Saldo: ${totalXp})_`);
    });

    lines.push(`\n─────────────────`);
    if (callerRank) {
      lines.push(`👤 *Sua Posição Semanal:* #${callerRank.position} (*${(callerRank.weeklyXp || 0).toLocaleString('pt-BR')} XP* na semana)`);
    } else {
      lines.push(`💡 Cadastre-se com *${p}cad* para pontuar na temporada!`);
    }

    if (isSunday) {
      lines.push(`\n🏖️ *AVISO DE DOMINGO:* O ranking da semana foi encerrado. A nova disputa semanal começará na Segunda-feira!`);
    }

    lines.push(`👥 *Total de Membros no Sistema:* ${totalUsers}`);

    await sock.sendMessage(remoteJid, { text: lines.join('\n') }, { quoted: msg });
  }
};
