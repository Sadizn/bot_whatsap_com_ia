import { PERMISSIONS } from '../../modules/permissionManager.js';
import { economyService } from '../../modules/economyService.js';
import { userStore } from '../../modules/userStore.js';

export const addXpCommand = {
  name: 'addxp',
  aliases: ['darxp', 'darmoeda'],
  category: 'admin',
  description: 'Adiciona XP a um usuário específico (Apenas Administradores)',
  permission: PERMISSIONS.ADMIN,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, senderJid, args, activePrefix }) {
    const p = activePrefix || '!';
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
    const targetJid = mentioned[0] || quotedParticipant;

    let amount = null;
    for (const arg of args) {
      const cleanArg = arg.replace('@', '').trim();
      if (/^\d+$/.test(cleanArg)) {
        amount = parseInt(cleanArg, 10);
      }
    }

    if (!targetJid || !amount) {
      return sock.sendMessage(
        remoteJid,
        { text: `❌ *Uso incorreto!*\n💡 Exemplo: *${p}addxp @membro 1000* ou responda a mensagem com *${p}addxp 1000*` },
        { quoted: msg }
      );
    }

    const result = economyService.adminAddXp(targetJid, amount, senderJid);
    if (!result.success) {
      return sock.sendMessage(
        remoteJid,
        { text: `❌ Usuário não encontrado ou valor inválido!` },
        { quoted: msg }
      );
    }

    const targetTag = `@${userStore.normalizeJid(targetJid).split('@')[0]}`;
    const text = [
      `🛡️ ❖ 𝐀𝐃𝐌𝐈𝐍: 𝐗𝐏 𝐀𝐃𝐈𝐂𝐈𝐎𝐍𝐀𝐃𝐎 ❖ 🛡️`,
      ``,
      `✅ Foi adicionado com sucesso!`,
      `👤 *Usuário:* ${targetTag} (${result.user.name})`,
      `➕ *Valor Injetado:* +${result.addedAmount.toLocaleString('pt-BR')} XP`,
      `💳 *Novo Saldo:* ${result.newBalance.toLocaleString('pt-BR')} XP`
    ].join('\n');

    await sock.sendMessage(remoteJid, { text, mentions: [targetJid] }, { quoted: msg });
  }
};

export const removeXpCommand = {
  name: 'removexp',
  aliases: ['tirarxp', 'removerxp', 'delxp'],
  category: 'admin',
  description: 'Remove XP de um usuário específico (Apenas Administradores)',
  permission: PERMISSIONS.ADMIN,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, senderJid, args, activePrefix }) {
    const p = activePrefix || '!';
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
    const targetJid = mentioned[0] || quotedParticipant;

    let amount = null;
    for (const arg of args) {
      const cleanArg = arg.replace('@', '').trim();
      if (/^\d+$/.test(cleanArg)) {
        amount = parseInt(cleanArg, 10);
      }
    }

    if (!targetJid || !amount) {
      return sock.sendMessage(
        remoteJid,
        { text: `❌ *Uso incorreto!*\n💡 Exemplo: *${p}removexp @membro 500* ou responda a mensagem com *${p}removexp 500*` },
        { quoted: msg }
      );
    }

    const result = economyService.adminRemoveXp(targetJid, amount, senderJid);
    if (!result.success) {
      return sock.sendMessage(
        remoteJid,
        { text: `❌ Usuário não encontrado ou valor inválido!` },
        { quoted: msg }
      );
    }

    const targetTag = `@${userStore.normalizeJid(targetJid).split('@')[0]}`;
    const text = [
      `🛡️ ❖ 𝐀𝐃𝐌𝐈𝐍: 𝐗𝐏 𝐑𝐄𝐌𝐎𝐕𝐈𝐃𝐎 ❖ 🛡️`,
      ``,
      `⚠️ Débito efetuado com sucesso!`,
      `👤 *Usuário:* ${targetTag} (${result.user.name})`,
      `➖ *Valor Deduzido:* -${result.removedAmount.toLocaleString('pt-BR')} XP`,
      `💳 *Novo Saldo:* ${result.newBalance.toLocaleString('pt-BR')} XP`
    ].join('\n');

    await sock.sendMessage(remoteJid, { text, mentions: [targetJid] }, { quoted: msg });
  }
};

export const extratoCommand = {
  name: 'extrato',
  aliases: ['historico', 'transacoes'],
  category: 'economy',
  description: 'Exibe o histórico recente de transações financeiras e XP',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, senderJid, permissions }) {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
    const targetMention = mentioned[0] || quotedParticipant;

    // Se marcou outro usuário e não é admin, rejeita
    let targetJid = senderJid;
    if (targetMention && userStore.normalizeJid(targetMention) !== userStore.normalizeJid(senderJid)) {
      if (permissions?.isAdmin || permissions?.isOwner) {
        targetJid = targetMention;
      } else {
        return sock.sendMessage(
          remoteJid,
          { text: `❌ Apenas administradores podem consultar o extrato de outros usuários.` },
          { quoted: msg }
        );
      }
    }

    const txs = economyService.getTransactions(targetJid, 7);
    const user = userStore.getUser(targetJid);
    const uName = user?.name || `@${userStore.normalizeJid(targetJid).split('@')[0]}`;

    if (!txs || txs.length === 0) {
      return sock.sendMessage(
        remoteJid,
        { text: `📜 Nenhuma transação recente encontrada para *${uName}*.` },
        { quoted: msg }
      );
    }

    const typeIcons = {
      DAILY: '🎁 [DIÁRIA]',
      WORK: '💼 [TRABALHO]',
      BET_WIN: '🎰 [CASSINO +]',
      BET_LOSS: '🎰 [CASSINO -]',
      TRANSFER_SENT: '📤 [ENVIADO]',
      TRANSFER_RECEIVED: '📥 [RECEBIDO]',
      ADMIN_ADD: '🛡️ [ADMIN +]',
      ADMIN_REMOVE: '🛡️ [ADMIN -]',
      MUSIC_PLAY: '🎵 [MÚSICA]'
    };

    let lines = [];
    lines.push(`╭───────────────╮`);
    lines.push(`│ ❖ 𝐄𝐗𝐓𝐑𝐀𝐓𝐎 𝐃𝐄 𝐗𝐏 ❖`);
    lines.push(`│ 👤 ❯ 𝐓𝐢𝐭𝐮𝐥𝐚𝐫: ${uName}`);
    lines.push(`│ 💰 ❯ 𝐒𝐚𝐥𝐝𝐨: ${(user?.xp || 0).toLocaleString('pt-BR')} XP`);
    lines.push(`╰───────────────╯\n`);

    txs.forEach((t, i) => {
      const icon = typeIcons[t.type] || '💵';
      const isPositive = t.amount > 0;
      const signal = isPositive ? '+' : '';
      const date = new Date(t.timestamp).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
      lines.push(`${icon} *${signal}${t.amount.toLocaleString('pt-BR')} XP*`);
      lines.push(`└ 📝 ${t.description} • _${date}_`);
    });

    await sock.sendMessage(remoteJid, { text: lines.join('\n') }, { quoted: msg });
  }
};
