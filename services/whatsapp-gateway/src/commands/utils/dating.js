import { userStore } from '../../modules/userStore.js';
import { PERMISSIONS } from '../../modules/permissionManager.js';

export const datingCommand = {
  name: 'namorar',
  aliases: ['casar', 'proposta', 'namoro', 'casamento'],
  category: 'utils',
  description: 'Pede alguém em namoro ou casamento no grupo',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: true,

  async execute({ msg, sock, remoteJid, senderJid, activePrefix }) {
    const p = activePrefix || '!';
    const userA = userStore.getUser(senderJid);

    if (!userA) {
      await sock.sendMessage(remoteJid, {
        text: `⚠️ Você precisa se cadastrar primeiro usando *${p}cad <nome> <sexo> <idade>*!`
      }, { quoted: msg });
      return;
    }

    if (userA.partner) {
      const partnerUser = userStore.getUser(userA.partner);
      const partnerName = partnerUser?.name || `@${userA.partner.split('@')[0]}`;
      await sock.sendMessage(remoteJid, {
        text: `💍 Você já está em um relacionamento com *${partnerName}*!\nPara terminar antes de pedir outro alguém, use *${p}terminar*.`,
        mentions: [userA.partner]
      }, { quoted: msg });
      return;
    }

    // Identificar a pessoa marcada
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
    const targetJid = mentioned[0] || quotedParticipant;

    if (!targetJid) {
      await sock.sendMessage(remoteJid, {
        text: `💖 *Como usar*: Marque a pessoa que deseja pedir em namoro!\n_Exemplo_: *${p}namorar @pessoa*`
      }, { quoted: msg });
      return;
    }

    if (targetJid === senderJid) {
      await sock.sendMessage(remoteJid, {
        text: '😂 Você não pode namorar consigo mesmo!'
      }, { quoted: msg });
      return;
    }

    const userB = userStore.getUser(targetJid);
    if (!userB) {
      await sock.sendMessage(remoteJid, {
        text: `⚠️ A pessoa marcada (@${targetJid.split('@')[0]}) ainda não se cadastrou no bot!\nEla deve digitar *${p}cad <nome> <sexo> <idade>* primeiro.`,
        mentions: [targetJid]
      }, { quoted: msg });
      return;
    }

    if (userB.partner) {
      const partnerB = userStore.getUser(userB.partner);
      const partnerBName = partnerB?.name || `@${userB.partner.split('@')[0]}`;
      await sock.sendMessage(remoteJid, {
        text: `💔 Que pena! *${userB.name}* já está namorando com *${partnerBName}*!`,
        mentions: [userB.partner]
      }, { quoted: msg });
      return;
    }

    // Registra proposta pendente
    userStore.proposeDating(senderJid, targetJid, remoteJid);

    let text = `╭───────────────╮\n`;
    text += `│ ❖ 𝐏𝐄𝐃𝐈𝐃𝐎 𝐃𝐄 𝐍𝐀𝐌𝐎𝐑𝐎 ❖\n`;
    text += `│ 💍 *${userA.name}* pediu @${targetJid.split('@')[0]} em namoro!\n`;
    text += `│ \n`;
    text += `│ @${targetJid.split('@')[0]}, você aceita?\n`;
    text += `│ 💖 Digite *${p}aceitar* para aceitar\n`;
    text += `│ 💔 Digite *${p}recusar* para recusar\n`;
    text += `╰───────────────╯\n`;
    text += `⏱️ _Você tem 2 minutos para responder._`;

    await sock.sendMessage(remoteJid, {
      text,
      mentions: [senderJid, targetJid]
    }, { quoted: msg });
  }
};

export const acceptDatingCommand = {
  name: 'aceitar',
  aliases: ['sim', 'aceito'],
  category: 'utils',
  description: 'Aceita um pedido de namoro recebido',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: true,

  async execute({ msg, sock, remoteJid, senderJid }) {
    const proposal = userStore.getProposal(senderJid);
    if (!proposal) {
      await sock.sendMessage(remoteJid, {
        text: '❌ Você não tem nenhum pedido de namoro pendente.'
      }, { quoted: msg });
      return;
    }

    const result = userStore.acceptDating(senderJid);
    if (result) {
      let text = `╭───────────────╮\n`;
      text += `│ ❖ 𝐍𝐎𝐕𝐎 𝐂𝐀𝐒𝐀𝐋 𝐎𝐅𝐈𝐂𝐈𝐀𝐋 ❖\n`;
      text += `│ ❤️ *${result.userTo.name}* aceitou o pedido de *${result.userFrom.name}*!\n`;
      text += `│ 💑 Agora eles estão namorando oficialmente!\n`;
      text += `╰───────────────╯\n`;
      text += `🎉 _Felicidades ao novo casal! Viva o amor!_`;

      await sock.sendMessage(remoteJid, {
        text,
        mentions: [result.userFrom.jid, result.userTo.jid]
      }, { quoted: msg });
    }
  }
};

export const rejectDatingCommand = {
  name: 'recusar',
  aliases: ['nao', 'rejeitar'],
  category: 'utils',
  description: 'Recusa um pedido de namoro recebido',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: true,

  async execute({ msg, sock, remoteJid, senderJid }) {
    const proposal = userStore.rejectDating(senderJid);
    if (proposal) {
      const fromUser = userStore.getUser(proposal.fromJid);
      const toUser = userStore.getUser(senderJid);
      const fromName = fromUser?.name || 'Pretendente';
      const toName = toUser?.name || 'Pessoa';

      await sock.sendMessage(remoteJid, {
        text: `💔 *Soldado abatido!* *${toName}* recusou o pedido de namoro de *${fromName}*.\n_Mais sorte na próxima!_`,
        mentions: [proposal.fromJid, senderJid]
      }, { quoted: msg });
    } else {
      await sock.sendMessage(remoteJid, {
        text: '❌ Você não tem nenhum pedido de namoro pendente.'
      }, { quoted: msg });
    }
  }
};

export const breakUpCommand = {
  name: 'terminar',
  aliases: ['divorcio', 'separar', 'solteiro'],
  category: 'utils',
  description: 'Termina o relacionamento atual',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, senderJid, activePrefix }) {
    const p = activePrefix || '!';
    const result = userStore.breakUp(senderJid);

    if (!result) {
      await sock.sendMessage(remoteJid, {
        text: `💔 Você já está solteiro(a)! Para namorar alguém, use *${p}namorar @pessoa*.`
      }, { quoted: msg });
      return;
    }

    const partnerName = result.partner?.name || 'ex-parceiro(a)';
    let text = `╭───────────────╮\n`;
    text += `│ ❖ 𝐅𝐈𝐌 𝐃𝐄 𝐑𝐄𝐋𝐀𝐂𝐈𝐎𝐍𝐀𝐌𝐄𝐍𝐓𝐎 ❖\n`;
    text += `│ 💔 *${result.user.name}* terminou o namoro com *${partnerName}*.\n`;
    text += `│ Ambos agora estão solteiros na pista!\n`;
    text += `╰───────────────╯`;

    await sock.sendMessage(remoteJid, {
      text,
      mentions: [senderJid, result.partnerJid].filter(Boolean)
    }, { quoted: msg });
  }
};

export const coupleCommand = {
  name: 'casal',
  aliases: ['relacionamento', 'amor', 'statuscasal'],
  category: 'utils',
  description: 'Mostra o status de relacionamento do seu perfil ou de alguém',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, senderJid, activePrefix }) {
    const p = activePrefix || '!';
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const targetJid = mentioned[0] || senderJid;

    const user = userStore.getUser(targetJid);
    if (!user) {
      await sock.sendMessage(remoteJid, {
        text: `⚠️ Usuário não cadastrado. Cadastre-se com *${p}cad <nome> <sexo> <idade>*.`
      }, { quoted: msg });
      return;
    }

    if (!user.partner) {
      await sock.sendMessage(remoteJid, {
        text: `💔 *${user.name}* está solteiro(a) no momento.\n_Para namorar alguém, use ${p}namorar @pessoa!_`
      }, { quoted: msg });
      return;
    }

    const partner = userStore.getUser(user.partner);
    const partnerName = partner?.name || `@${user.partner.split('@')[0]}`;

    let daysTogether = 0;
    if (user.relationshipDate) {
      const diffTime = Math.abs(Date.now() - new Date(user.relationshipDate).getTime());
      daysTogether = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    let text = `╭───────────────╮\n`;
    text += `│ ❖ 𝐒𝐓𝐀𝐓𝐔𝐒 𝐃𝐎 𝐂𝐀𝐒𝐀𝐋 ❖\n`;
    text += `│ 💍 *${user.name}* ❤️ *${partnerName}*\n`;
    text += `│ ⏳ *Tempo juntos*: ${daysTogether} dia(s)\n`;
    text += `│ 📅 *Desde*: ${new Date(user.relationshipDate).toLocaleDateString('pt-BR')}\n`;
    text += `╰───────────────╯`;

    await sock.sendMessage(remoteJid, {
      text,
      mentions: [user.jid, user.partner]
    }, { quoted: msg });
  }
};
