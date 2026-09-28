import { PERMISSIONS } from '../../modules/permissionManager.js';
import { configStore } from '../../utils/configStore.js';

export const statusCommand = {
  name: 'status',
  aliases: ['info', 'estado'],
  category: 'utils',
  description: 'Exibe o status atual da Edith, modo de operação e prefixo ativo',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, isGroup }) {
    const config = configStore.get();
    const groupConfig = isGroup ? configStore.getGroupConfig(remoteJid) : null;

    let text = `🤖 *STATUS DA EDITH*\n\n`;
    text += `• *Modo de Operação*: ${isGroup ? '👥 Grupo (Membro/Participante)' : '👤 Privado (Assistente do Mananga)'}\n`;
    text += `• *Motor de IA*: ${config.ai?.enabled ? '🟢 Ativo' : '🔴 Pausado'}\n`;
    text += `• *Modelo de IA*: ${config.ai?.model || 'Gemini 3.5 Flash'}\n`;
    text += `• *Prefixo*: ${isGroup && groupConfig?.prefix ? groupConfig.prefix : (config.whatsapp?.prefix || '!')}\n`;
    text += `• *Respostas Automáticas*: ${config.whatsapp?.autoReply !== false ? '🟢 Ligadas' : '🔴 Desligadas'}\n`;

    await sock.sendMessage(remoteJid, { text: text.trim() }, { quoted: msg });
  }
};
