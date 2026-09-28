import { PERMISSIONS } from '../../modules/permissionManager.js';
import { economyService } from '../../modules/economyService.js';
import { userStore } from '../../modules/userStore.js';

export const workCommand = {
  name: 'trabalho',
  aliases: ['work', 'trampo', 'job'],
  category: 'economy',
  description: 'Trabalha para receber uma remuneração em XP (Disponível a cada 24 horas)',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, senderJid, userName }) {
    const isRegistered = userStore.isRegistered(senderJid);
    if (!isRegistered) {
      return sock.sendMessage(
        remoteJid,
        { text: `❌ Você precisa estar cadastrado para trabalhar e receber XP!\n💡 Use: *!cad <seu_nome> <sexo> <idade>*` },
        { quoted: msg }
      );
    }

    const result = economyService.work(senderJid);

    if (!result.success) {
      if (result.reason === 'COOLDOWN') {
        const text = [
          `😴 ❖ 𝐃𝐄𝐒𝐂𝐀𝐍𝐒𝐎 𝐃𝐄 𝐓𝐑𝐀𝐁𝐀𝐋𝐇𝐎 ❖ 😴`,
          ``,
          `❌ Você está cansado da sua última jornada de trabalho!`,
          `⏰ *Próximo turno em:* ${result.formattedRemaining}`,
          `💡 Descanse bem antes de assumir outro serviço.`
        ].join('\n');

        return sock.sendMessage(remoteJid, { text }, { quoted: msg });
      }

      return sock.sendMessage(
        remoteJid,
        { text: `❌ Não foi possível iniciar o trabalho agora. Tente novamente mais tarde.` },
        { quoted: msg }
      );
    }

    const uName = userName || 'Trabalhador';
    const text = [
      `💼 ❖ 𝐉𝐎𝐑𝐍𝐀𝐃𝐀 𝐃𝐄 𝐓𝐑𝐀𝐁𝐀𝐋𝐇𝐎 ❖ 💼`,
      ``,
      `👤 *Trabalhador:* ${uName}`,
      `👔 *Profissão:* ${result.job.title}`,
      `📝 *Atividade:* ${result.job.desc}`,
      ``,
      `💵 *Salário Recebido:* +${result.reward.toLocaleString('pt-BR')} XP`,
      `💳 *Saldo Atualizado:* ${result.newBalance.toLocaleString('pt-BR')} XP`,
      `⏳ *Próximo Turno:* em 24 horas`,
      ``,
      `💡 *Dica:* Você pode apostar seu XP com *!bet <valor>* ou verificar seu extrato com *!carteira*!`
    ].join('\n');

    await sock.sendMessage(remoteJid, { text }, { quoted: msg });
  }
};
