import { PERMISSIONS } from '../../modules/permissionManager.js';

export const pingCommand = {
  name: 'ping',
  aliases: ['p', 'latencia'],
  category: 'utils',
  description: 'Verifica a conectividade e o tempo de resposta da Edith',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,
  
  async execute({ msg, sock, remoteJid }) {
    const start = Date.now();
    await sock.sendMessage(remoteJid, {
      text: `🏓 *Pong!*\n⚡ *Status*: Online\n⏱️ *Tempo de Resposta*: ~${Date.now() - start}ms`
    }, { quoted: msg });
  }
};
