import { PERMISSIONS } from '../../modules/permissionManager.js';
import { economyService, ECONOMY_CONFIG } from '../../modules/economyService.js';
import { userStore } from '../../modules/userStore.js';

export const betCommand = {
  name: 'bet',
  aliases: ['apostar', 'aposta', 'cassino'],
  category: 'economy',
  description: 'Aposta uma quantia de XP no cassino (Multiplicador 2.0x)',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, senderJid, args, userName }) {
    const isRegistered = userStore.isRegistered(senderJid);
    if (!isRegistered) {
      return sock.sendMessage(
        remoteJid,
        { text: `❌ Você precisa estar cadastrado para apostar XP!\n💡 Use: *!cad <seu_nome> <sexo> <idade>*` },
        { quoted: msg }
      );
    }

    if (!args || args.length === 0) {
      const min = ECONOMY_CONFIG.BET_MIN_XP;
      const max = ECONOMY_CONFIG.BET_MAX_XP.toLocaleString('pt-BR');
      const text = [
        `🎰 ❖ 𝐂𝐀𝐒𝐒𝐈𝐍𝐎 𝐃𝐄 𝐗𝐏 ❖ 🎰`,
        ``,
        `💡 *Como apostar:*`,
        `❯ *!bet <valor>* (Ex: !bet 100, !bet 500, !bet 1000)`,
        `❯ *!bet all* (Aposta todo o seu saldo até o limite)`,
        ``,
        `📊 *Regras do Jogo:*`,
        `❯ *Aposta mínima:* ${min} XP`,
        `❯ *Aposta máxima:* ${max} XP`,
        `❯ *Multiplicador de Vitória:* 2.0x (Dobra o valor)`,
        `❯ *Probabilidade:* 45% de chance de vitória`
      ].join('\n');

      return sock.sendMessage(remoteJid, { text }, { quoted: msg });
    }

    const user = userStore.getUser(senderJid);
    const userBalance = user?.xp || 0;
    const inputArg = args[0].toLowerCase().trim();

    let amount = 0;
    if (inputArg === 'all' || inputArg === 'tudo') {
      amount = Math.min(userBalance, ECONOMY_CONFIG.BET_MAX_XP);
      if (amount < ECONOMY_CONFIG.BET_MIN_XP) {
        return sock.sendMessage(
          remoteJid,
          { text: `❌ Seu saldo (${userBalance.toLocaleString('pt-BR')} XP) é inferior ao valor mínimo de aposta (${ECONOMY_CONFIG.BET_MIN_XP} XP).` },
          { quoted: msg }
        );
      }
    } else {
      // Valida número inteiro puro (sem decimais, sem sinais inválidos)
      if (!/^\d+$/.test(inputArg)) {
        return sock.sendMessage(
          remoteJid,
          { text: `❌ Quantia inválida! Digite um número inteiro positivo (ex: *!bet 200*).` },
          { quoted: msg }
        );
      }
      amount = parseInt(inputArg, 10);
    }

    if (isNaN(amount) || amount <= 0) {
      return sock.sendMessage(
        remoteJid,
        { text: `❌ Quantia inválida para aposta.` },
        { quoted: msg }
      );
    }

    const result = economyService.placeBet(senderJid, amount);

    if (!result.success) {
      return sock.sendMessage(
        remoteJid,
        { text: `❌ ${result.message}` },
        { quoted: msg }
      );
    }

    const uName = userName || 'Apostador';
    const winRate = result.stats.totalBets > 0
      ? ((result.stats.wins / result.stats.totalBets) * 100).toFixed(1)
      : '0';

    if (result.won) {
      const text = [
        `🎰 ❖ 𝐂𝐀𝐒𝐒𝐈𝐍𝐎: 𝐕𝐈𝐓𝐎́𝐑𝐈𝐀! ❖ 🎰`,
        ``,
        `🎉 🎊 *PARABÉNS, ${uName.toUpperCase()}!* 🎊 🎉`,
        `🎲 O resultado foi favorável e você multiplicou sua aposta!`,
        ``,
        `💰 *Valor Apostado:* ${result.amount.toLocaleString('pt-BR')} XP`,
        `📈 *Lucro Líquido:* +${result.profit.toLocaleString('pt-BR')} XP (2.0x)`,
        `💳 *Novo Saldo:* ${result.newBalance.toLocaleString('pt-BR')} XP`,
        ``,
        `📊 *Seu Histórico:* ${result.stats.wins}V / ${result.stats.losses}D (${winRate}% taxa de vitória)`
      ].join('\n');

      return sock.sendMessage(remoteJid, { text }, { quoted: msg });
    } else {
      const text = [
        `🎰 ❖ 𝐂𝐀𝐒𝐒𝐈𝐍𝐎: 𝐃𝐄𝐑𝐑𝐎𝐓𝐀 ❖ 🎰`,
        ``,
        `💥 *QUE PENA, ${uName.toUpperCase()}!*`,
        `🎲 A sorte não esteve ao seu lado desta vez...`,
        ``,
        `💸 *Valor Perdido:* -${result.amount.toLocaleString('pt-BR')} XP`,
        `💳 *Saldo Restante:* ${result.newBalance.toLocaleString('pt-BR')} XP`,
        ``,
        `📊 *Seu Histórico:* ${result.stats.wins}V / ${result.stats.losses}D (${winRate}% taxa de vitória)`,
        `💡 Resgate sua diária (*!diaria*) ou trabalhe (*!trabalho*) para recuperar XP!`
      ].join('\n');

      return sock.sendMessage(remoteJid, { text }, { quoted: msg });
    }
  }
};
