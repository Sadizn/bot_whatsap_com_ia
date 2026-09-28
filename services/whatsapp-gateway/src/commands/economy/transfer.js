import { PERMISSIONS } from '../../modules/permissionManager.js';
import { economyService, ECONOMY_CONFIG } from '../../modules/economyService.js';
import { userStore } from '../../modules/userStore.js';

export const transferCommand = {
  name: 'enviar',
  aliases: ['pay', 'transferir', 'doar', 'pix'],
  category: 'economy',
  description: 'Transfere uma quantidade de XP para outro usuário (Limite: 1.500 XP/dia)',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, senderJid, args, activePrefix }) {
    const p = activePrefix || '!';
    const isRegistered = userStore.isRegistered(senderJid);
    if (!isRegistered) {
      return sock.sendMessage(
        remoteJid,
        { text: `❌ Você precisa estar cadastrado para transferir XP!\n💡 Use: *${p}cad <seu_nome> <sexo> <idade>*` },
        { quoted: msg }
      );
    }

    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
    const targetJid = mentioned[0] || quotedParticipant;

    // Procura o valor nos argumentos (ignora argumentos com @ ou seleciona o último número)
    let amount = null;
    for (const arg of args) {
      const cleanArg = arg.replace('@', '').trim();
      if (/^\d+$/.test(cleanArg)) {
        amount = parseInt(cleanArg, 10);
      }
    }

    if (!targetJid || !amount) {
      const text = [
        `💸 ❖ 𝐓𝐑𝐀𝐍𝐒𝐅𝐄𝐑𝐄̂𝐍𝐂𝐈𝐀 𝐃𝐄 𝐗𝐏 ❖ 💸`,
        ``,
        `💡 *Como usar:*`,
        `❯ *${p}enviar @membro <valor>*`,
        `❯ *${p}pix @membro <valor>*`,
        `❯ Ou responda à mensagem de alguém com *${p}enviar <valor>*`,
        ``,
        `📊 *Regras de Envio:*`,
        `❯ *Limite diário de envio:* ${ECONOMY_CONFIG.MAX_DAILY_TRANSFER_XP.toLocaleString('pt-BR')} XP por usuário`,
        `❯ *Valor mínimo:* 1 XP`,
        `❯ Ambas as contas devem estar cadastradas com *${p}cad*`
      ].join('\n');

      return sock.sendMessage(remoteJid, { text }, { quoted: msg });
    }

    if (userStore.normalizeJid(targetJid) === userStore.normalizeJid(senderJid)) {
      return sock.sendMessage(
        remoteJid,
        { text: `❌ Você não pode transferir XP para você mesmo!` },
        { quoted: msg }
      );
    }

    const result = economyService.transferXp(senderJid, targetJid, amount);

    if (!result.success) {
      return sock.sendMessage(
        remoteJid,
        { text: `❌ ${result.message}` },
        { quoted: msg }
      );
    }

    const senderTag = `@${userStore.normalizeJid(senderJid).split('@')[0]}`;
    const receiverTag = `@${userStore.normalizeJid(targetJid).split('@')[0]}`;

    const text = [
      `💸 ❖ 𝐓𝐑𝐀𝐍𝐒𝐅𝐄𝐑𝐄̂𝐍𝐂𝐈𝐀 𝐂𝐎𝐍𝐂𝐋𝐔𝐈́𝐃𝐀 ❖ 💸`,
      ``,
      `✅ *Transferência de XP realizada com sucesso!*`,
      ``,
      `📤 *Remetente:* ${senderTag} (${result.sender.name})`,
      `📥 *Destinatário:* ${receiverTag} (${result.receiver.name})`,
      `💰 *Valor Enviado:* ${result.amount.toLocaleString('pt-BR')} XP`,
      ``,
      `💳 *Seu Novo Saldo:* ${result.senderBalance.toLocaleString('pt-BR')} XP`,
      `⏳ *Limite restante para envio hoje:* ${result.remainingDailyLimit.toLocaleString('pt-BR')} XP / ${ECONOMY_CONFIG.MAX_DAILY_TRANSFER_XP.toLocaleString('pt-BR')} XP`
    ].join('\n');

    await sock.sendMessage(
      remoteJid,
      { text, mentions: [senderJid, targetJid] },
      { quoted: msg }
    );
  }
};
