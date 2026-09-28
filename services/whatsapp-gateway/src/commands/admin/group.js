import { PERMISSIONS } from '../../modules/permissionManager.js';
import { configStore } from '../../utils/configStore.js';

export const groupCommand = {
  name: 'grupo',
  aliases: ['group', 'gconfig'],
  category: 'admin',
  description: 'Gerencia as configurações básicas da Edith para este grupo',
  permission: PERMISSIONS.ADMIN,
  groupOnly: true,

  async execute({ msg, sock, remoteJid, args }) {
    const sub = args[0]?.toLowerCase();
    const current = configStore.getGroupConfig(remoteJid);

    if (!sub || sub === 'status' || sub === 'ver') {
      let text = `⚙️ *CONFIGURAÇÕES DO GRUPO*\n\n`;
      text += `• *Edith Ativa no Grupo*: ${current.enabled !== false ? '✅ Sim' : '❌ Não'}\n`;
      text += `• *Prefixo do Grupo*: *${current.prefix || '!'}*\n`;
      text += `• *Comandos Públicos*: ${current.allowPublicCommands !== false ? '✅ Permitidos' : '🔒 Apenas Admins'}\n\n`;
      text += `💡 *Comandos de alteração*:\n`;
      text += `• *!grupo prefixo <símbolo>* (ex: !grupo prefixo #)\n`;
      text += `• *!grupo status on/off* (ativa/desativa a Edith no grupo)\n`;
      text += `• *!grupo publicos on/off* (restringe comandos a admins)\n`;

      await sock.sendMessage(remoteJid, { text: text.trim() }, { quoted: msg });
      return;
    }

    if (sub === 'prefixo' || sub === 'prefix') {
      const newPrefix = args[1]?.trim();
      if (!newPrefix || newPrefix.length > 2) {
        await sock.sendMessage(remoteJid, {
          text: `⚠️ Por favor, informe um prefixo válido de 1 ou 2 caracteres. Ex: *!grupo prefixo #*`
        }, { quoted: msg });
        return;
      }

      configStore.updateGroupConfig(remoteJid, { prefix: newPrefix });
      await sock.sendMessage(remoteJid, {
        text: `✅ Prefixo deste grupo alterado com sucesso para: *${newPrefix}*`
      }, { quoted: msg });
      return;
    }

    if (sub === 'status') {
      const val = args[1]?.toLowerCase();
      const isEnabled = val === 'on' || val === 'ativar' || val === '1';
      const isDisable = val === 'off' || val === 'desativar' || val === '0';

      if (!isEnabled && !isDisable) {
        await sock.sendMessage(remoteJid, {
          text: `⚠️ Escolha *on* ou *off*. Ex: *!grupo status on* ou *!grupo status off*`
        }, { quoted: msg });
        return;
      }

      configStore.updateGroupConfig(remoteJid, { enabled: isEnabled });
      await sock.sendMessage(remoteJid, {
        text: `✅ Edith foi *${isEnabled ? 'ATIVADA' : 'DESATIVADA'}* para este grupo.`
      }, { quoted: msg });
      return;
    }

    if (sub === 'publicos' || sub === 'public') {
      const val = args[1]?.toLowerCase();
      const allow = val === 'on' || val === 'ativar' || val === '1';
      const disallow = val === 'off' || val === 'desativar' || val === '0';

      if (!allow && !disallow) {
        await sock.sendMessage(remoteJid, {
          text: `⚠️ Escolha *on* ou *off*. Ex: *!grupo publicos on* ou *!grupo publicos off*`
        }, { quoted: msg });
        return;
      }

      configStore.updateGroupConfig(remoteJid, { allowPublicCommands: allow });
      await sock.sendMessage(remoteJid, {
        text: `✅ Comandos públicos agora estão: *${allow ? 'PERMITIDOS PARA TODOS' : 'RESTRITOS A ADMINS'}*.`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(remoteJid, {
      text: `⚠️ Subcomando desconhecido. Digite *!grupo* para ver as opções disponíveis.`
    }, { quoted: msg });
  }
};
