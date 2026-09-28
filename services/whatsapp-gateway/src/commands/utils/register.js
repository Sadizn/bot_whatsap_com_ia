import { userStore } from '../../modules/userStore.js';
import { PERMISSIONS } from '../../modules/permissionManager.js';

export const registerCommand = {
  name: 'cad',
  aliases: ['cadastrar', 'registro', 'registrar'],
  category: 'utils',
  description: 'Cadastra seu perfil no bot para liberar acesso a todos os comandos',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, senderJid, rawArgs, pushName, activePrefix }) {
    const p = activePrefix || '!';

    if (!rawArgs || !rawArgs.trim()) {
      await sock.sendMessage(remoteJid, {
        text: `📝 *Como se cadastrar na Edith*:\n\n👉 *${p}cad <nome> <sexo> <idade>*\n\n_Exemplo_: *${p}cad Barbara F 18*\n_Exemplo_: *${p}cad João M 22*\n\n*(Sexo: M para Masculino, F para Feminino)*`
      }, { quoted: msg });
      return;
    }

    const parts = rawArgs.trim().split(/\s+/);
    if (parts.length < 3) {
      await sock.sendMessage(remoteJid, {
        text: `⚠️ *Formato incorreto!*\nUse: *${p}cad <nome> <sexo> <idade>*\n_Exemplo_: *${p}cad Barbara F 18*`
      }, { quoted: msg });
      return;
    }

    const ageStr = parts[parts.length - 1];
    const genderStr = parts[parts.length - 2].toUpperCase();
    const nameStr = parts.slice(0, parts.length - 2).join(' ');

    const age = parseInt(ageStr, 10);
    if (isNaN(age) || age < 5 || age > 120) {
      await sock.sendMessage(remoteJid, {
        text: '❌ Idade inválida. Informe um número entre 5 e 120.'
      }, { quoted: msg });
      return;
    }

    if (!['M', 'F', 'O', 'MASCULINO', 'FEMININO', 'OUTRO'].includes(genderStr)) {
      await sock.sendMessage(remoteJid, {
        text: '❌ Sexo inválido. Use *M* (Masculino), *F* (Feminino) ou *O* (Outro).'
      }, { quoted: msg });
      return;
    }

    const user = userStore.register(senderJid, {
      name: nameStr,
      gender: genderStr,
      age: age,
      pushName: pushName
    });

    let card = `╭───────────────╮\n`;
    card += `│ ❖ 𝐂𝐀𝐃𝐀𝐒𝐓𝐑𝐎 𝐑𝐄𝐀𝐋𝐈𝐙𝐀𝐃𝐎 ❖\n`;
    card += `│ ✰ ❯ 𝐍𝐨𝐦𝐞: ${user.name}\n`;
    card += `│ ✰ ❯ 𝐒𝐞𝐱𝐨: ${user.gender}\n`;
    card += `│ ✰ ❯ 𝐈𝐝𝐚𝐝𝐞: ${user.age} anos\n`;
    card += `│ ✰ ❯ 𝐒𝐭𝐚𝐭𝐮𝐬: 💔 Solteiro(a)\n`;
    card += `╰───────────────╯\n`;
    card += `🎉 _Parabéns, ${user.name}! Seu cadastro foi salvo na memória e você agora pode usar todos os comandos da Edith._`;

    await sock.sendMessage(remoteJid, { text: card }, { quoted: msg });
  }
};
