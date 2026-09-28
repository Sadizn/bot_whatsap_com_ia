import { PERMISSIONS } from '../../modules/permissionManager.js';
import { economyService } from '../../modules/economyService.js';
import { userStore } from '../../modules/userStore.js';

export const walletCommand = {
  name: 'carteira',
  aliases: ['saldo', 'wallet', 'xp', 'banco'],
  category: 'economy',
  description: 'Exibe o extrato completo da sua carteira, timers e estatísticas',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, senderJid, activePrefix }) {
    const p = activePrefix || '!';
    const isRegistered = userStore.isRegistered(senderJid);
    if (!isRegistered) {
      return sock.sendMessage(
        remoteJid,
        { text: `❌ Você precisa estar cadastrado para ver sua carteira de XP!\n💡 Use: *${p}cad <seu_nome> <sexo> <idade>*` },
        { quoted: msg }
      );
    }

    const wallet = economyService.getWallet(senderJid);
    if (!wallet) {
      return sock.sendMessage(
        remoteJid,
        { text: `❌ Não foi possível carregar os dados da carteira.` },
        { quoted: msg }
      );
    }

    const u = wallet.user;
    const dailyIcon = wallet.daily.ready ? '✅ Disponível' : `⏳ ${wallet.daily.status}`;
    const workIcon = wallet.work.ready ? '✅ Disponível' : `⏳ ${wallet.work.status}`;

    const profitSymbol = wallet.betStats.profit >= 0 ? '+' : '';
    const profitText = `${profitSymbol}${wallet.betStats.profit.toLocaleString('pt-BR')} XP`;

    const text = [
      `╭───────────────╮`,
      `│ ❖ 𝐂𝐀𝐑𝐓𝐄𝐈𝐑𝐀 𝐄𝐃𝐈𝐓𝐇 ❖`,
      `│ 👤 ❯ 𝐓𝐢𝐭𝐮𝐥𝐚𝐫: ${u.name}`,
      `│ 💰 ❯ 𝐒𝐚𝐥𝐝𝐨 𝐗𝐏: ${wallet.xp.toLocaleString('pt-BR')} XP`,
      `╰───────────────╯`,
      ``,
      `╭───────────────╮`,
      `│ ❖ 𝐒𝐓𝐀𝐓𝐔𝐒 𝐃𝐄 𝐀𝐓𝐈𝐕𝐈𝐃𝐀𝐃𝐄 ❖`,
      `│ 🎁 ❯ 𝐃𝐢𝐚́𝐫𝐢𝐚: ${dailyIcon}`,
      `│ 💼 ❯ 𝐓𝐫𝐚𝐛𝐚𝐥𝐡𝐨: ${workIcon}`,
      `│ 💸 ❯ 𝐋𝐢𝐦𝐢𝐭𝐞 𝐄𝐧𝐯𝐢𝐨 𝐇𝐨𝐣𝐞: ${wallet.transfers.limitRemaining.toLocaleString('pt-BR')} / ${wallet.transfers.maxDaily.toLocaleString('pt-BR')} XP`,
      `╰───────────────╯`,
      ``,
      `╭───────────────╮`,
      `│ ❖ 𝐄𝐒𝐓𝐀𝐓𝐈́𝐒𝐓𝐈𝐂𝐀𝐒 𝐂𝐀𝐒𝐒𝐈𝐍𝐎 ❖`,
      `│ 🎲 ❯ 𝐓𝐨𝐭𝐚𝐥 𝐀𝐩𝐨𝐬𝐭𝐚𝐬: ${wallet.betStats.totalBets}`,
      `│ 🏆 ❯ 𝐕𝐢𝐭𝐨́𝐫𝐢𝐚𝐬: ${wallet.betStats.wins} | 💥 𝐃𝐞𝐫𝐫𝐨𝐭𝐚𝐬: ${wallet.betStats.losses}`,
      `│ 🎯 ❯ 𝐓𝐚𝐱𝐚 𝐝𝐞 𝐀𝐜𝐞𝐫𝐭𝐨: ${wallet.betStats.winRate}`,
      `│ 📈 ❯ 𝐋𝐮𝐜𝐫𝐨 𝐋𝐢́𝐪𝐮𝐢𝐝𝐨: ${profitText}`,
      `╰───────────────╯`,
      ``,
      `💡 *Atalhos Úteis:*`,
      `❯ *${p}diaria* • Coletar bônus diário`,
      `❯ *${p}trabalho* • Ganhar salário`,
      `❯ *${p}bet <valor>* • Jogar no cassino`,
      `❯ *${p}enviar @membro <valor>* • Fazer PIX de XP`,
      `❯ *${p}ranking* • Ver os mais ricos`
    ].join('\n');

    await sock.sendMessage(remoteJid, { text }, { quoted: msg });
  }
};
