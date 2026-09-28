import { PERMISSIONS } from '../../modules/permissionManager.js';
import { configStore } from '../../utils/configStore.js';

export const rulesCommand = {
  name: 'regras',
  aliases: ['rules', 'normas'],
  category: 'utils',
  description: 'Exibe as regras configuradas para o grupo atual',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: true,

  async execute({ msg, sock, remoteJid }) {
    const config = configStore.getGroupConfig(remoteJid);
    const rulesText = config.rules || '1. Respeitar todos os membros.\n2. Proibido spam ou conteúdo ofensivo.\n3. Divirtam-se!';
    
    await sock.sendMessage(remoteJid, {
      text: `📜 *REGRAS DO GRUPO*\n\n${rulesText}\n\n_Edith Assistente_`
    }, { quoted: msg });
  }
};
