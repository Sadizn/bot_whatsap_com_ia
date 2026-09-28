import { groupConfigManager } from '../../modules/groupConfigManager.js';

export const groupConfigCommand = {
  name: 'config',
  aliases: ['modulo', 'modulos', 'settings'],
  category: 'admin',
  description: 'Gerencia as configurações e ativação de módulos no grupo atual',
  adminOnly: true,
  ownerOnly: false,
  groupOnly: true,

  async execute({ msg, sock, remoteJid, args }) {
    const subCommand = args[0]?.toLowerCase();
    const targetModule = args[1]?.toLowerCase();
    const action = args[2]?.toLowerCase();

    const current = groupConfigManager.getGroupConfig(remoteJid);

    if (!subCommand || subCommand === 'status' || subCommand === 'ver') {
      const mods = current.enabledModules || {};
      let text = `⚙️ *CONFIGURAÇÃO DO GRUPO*\n\n`;
      text += `• Jogos (games): ${mods.games !== false ? '✅ ATIVADO' : '❌ DESATIVADO'}\n`;
      text += `• Música (music): ${mods.music !== false ? '✅ ATIVADO' : '❌ DESATIVADO'}\n`;
      text += `• Moderação (admin): ${mods.admin !== false ? '✅ ATIVADO' : '❌ DESATIVADO'}\n`;
      text += `• Utilidades (utils): ${mods.utils !== false ? '✅ ATIVADO' : '❌ DESATIVADO'}\n\n`;
      text += `💡 *Para alterar*: use *!config modulo <nome> on/off*\nEx: _!config modulo games off_`;
      
      await sock.sendMessage(remoteJid, { text }, { quoted: msg });
      return;
    }

    if (subCommand === 'modulo' || subCommand === 'module') {
      const validModules = ['games', 'music', 'admin', 'utils'];
      if (!validModules.includes(targetModule)) {
        await sock.sendMessage(remoteJid, {
          text: `⚠️ Módulo inválido. Módulos disponíveis: ${validModules.join(', ')}`
        }, { quoted: msg });
        return;
      }

      const isEnabled = action === 'on' || action === 'ativar' || action === '1' || action === 'true';
      const isDisable = action === 'off' || action === 'desativar' || action === '0' || action === 'false';

      if (!isEnabled && !isDisable) {
        await sock.sendMessage(remoteJid, {
          text: `⚠️ Defina se deseja ativar ou desativar o módulo.\nEx: *!config modulo ${targetModule} on* ou *!config modulo ${targetModule} off*`
        }, { quoted: msg });
        return;
      }

      groupConfigManager.updateGroupConfig(remoteJid, {
        enabledModules: {
          [targetModule]: isEnabled
        }
      });

      await sock.sendMessage(remoteJid, {
        text: `✅ O módulo *${targetModule}* foi ${isEnabled ? 'ATIVADO' : 'DESATIVADO'} para este grupo!`
      }, { quoted: msg });
    }
  }
};
