import { PERMISSIONS } from '../../modules/permissionManager.js';
import { economyService } from '../../modules/economyService.js';
import { userStore } from '../../modules/userStore.js';

export const dailyCommand = {
  name: 'diaria',
  aliases: ['daily', 'recompensa'],
  category: 'economy',
  description: 'Coleta a recompensa diária de XP (Disponível a cada 24 horas)',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, senderJid, userName }) {
    const isRegistered = userStore.isRegistered(senderJid);
    if (!isRegistered) {
      return sock.sendMessage(
        remoteJid,
        { text: `❌ Você precisa estar cadastrado para coletar sua recompensa diária!\n💡 Use: *!cad <seu_nome> <sexo> <idade>*` },
        { quoted: msg }
      );
    }

    const result = economyService.claimDaily(senderJid);

    if (!result.success) {
      if (result.reason === 'COOLDOWN') {
        const text = [
          `⏳ ❖ 𝐑𝐄𝐂𝐎𝐌𝐏𝐄𝐍𝐒𝐀 𝐃𝐈𝐀́𝐑𝐈𝐀 ❖ ⏳`,
          ``,
          `❌ Você já coletou sua diária recentemente!`,
          `⏰ *Tempo restante:* ${result.formattedRemaining}`,
          `💡 Volte novamente quando o tempo expirar para resgatar mais XP.`
        ].join('\n');

        return sock.sendMessage(remoteJid, { text }, { quoted: msg });
      }

      return sock.sendMessage(
        remoteJid,
        { text: `❌ Não foi possível coletar sua diária no momento. Tente novamente mais tarde.` },
        { quoted: msg }
      );
    }

    const uName = userName || 'Membro';
    const text = [
      `🎁 ❖ 𝐑𝐄𝐂𝐎𝐌𝐏𝐄𝐍𝐒𝐀 𝐃𝐈𝐀́𝐑𝐈𝐀 ❖ 🎁`,
      ``,
      `✨ Parabéns, *${uName}*!`,
      `💰 *Recompensa Coletada:* +${result.reward.toLocaleString('pt-BR')} XP`,
      `💳 *Novo Saldo:* ${result.newBalance.toLocaleString('pt-BR')} XP`,
      `⏳ *Próxima Diária:* em 24 horas`,
      ``,
      `💡 *Dica:* Use *!trabalho* para ganhar ainda mais XP ou *!carteira* para ver seus detalhes!`
    ].join('\n');

    await sock.sendMessage(remoteJid, { text }, { quoted: msg });
  }
};
