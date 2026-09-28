import { commandRegistry } from '../commands/index.js';
import { permissionManager, PERMISSIONS } from './permissionManager.js';
import { userStore } from './userStore.js';
import { configStore } from '../utils/configStore.js';
import { logger } from '../utils/logger.js';

class CommandDispatcher {
  /**
   * Identifica e executa comandos com prefixo
   * @param {Object} params
   * @param {string} params.text - Texto limpo da mensagem
   * @param {Object} params.msg - Objeto da mensagem Baileys
   * @param {Object} params.sock - Socket do Baileys
   * @param {string} params.remoteJid - JID da conversa
   * @param {boolean} params.isGroup - Se é grupo
   * @param {string} params.pushName - Nome do contato
   * @returns {Promise<boolean>} true se executou um comando, false caso contrário
   */
  async dispatch({ text, msg, sock, remoteJid, isGroup, pushName }) {
    if (!text || typeof text !== 'string') {
      return false;
    }

    const currentConfig = configStore.get();
    const groupConfig = isGroup ? configStore.getGroupConfig(remoteJid) : null;
    
    // Obter prefixo ativo para o chat atual
    const activePrefix = (isGroup && groupConfig?.prefix) 
      ? groupConfig.prefix 
      : (currentConfig.whatsapp?.prefix || '!');

    if (!text.startsWith(activePrefix)) {
      return false;
    }

    // Se o bot estiver desativado nas configurações específicas deste grupo
    if (isGroup && groupConfig?.enabled === false) {
      return false;
    }

    const trimmed = text.slice(activePrefix.length).trim();
    if (!trimmed) return false;

    const parts = trimmed.split(/\s+/);
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);
    const rawArgs = trimmed.substring(commandName.length).trim();

    const command = commandRegistry.get(commandName);
    if (!command) {
      return false;
    }

    // 1. Restrições de ambiente (apenas grupos ou apenas privado)
    if (command.groupOnly && !isGroup) {
      await sock.sendMessage(remoteJid, {
        text: `⚠️ O comando *${activePrefix}${command.name}* só pode ser utilizado em grupos.`
      }, { quoted: msg });
      return true;
    }

    if (command.privateOnly && isGroup) {
      await sock.sendMessage(remoteJid, {
        text: `⚠️ O comando *${activePrefix}${command.name}* só pode ser utilizado em conversas privadas.`
      }, { quoted: msg });
      return true;
    }

    // 2. Obter remetente real
    const senderJid = isGroup ? (msg.key.participant || msg.participant || remoteJid) : remoteJid;

    // 3. Verificar permissões (PUBLIC, ADMIN, OWNER)
    const permissions = await permissionManager.getPermissions({
      senderJid,
      groupJid: isGroup ? remoteJid : null,
      sock
    });

    const requiredPermission = command.permission || PERMISSIONS.PUBLIC;
    
    // Se o grupo desativou comandos para membros comuns e o usuário for PUBLIC
    if (isGroup && groupConfig?.allowPublicCommands === false && permissions.role === PERMISSIONS.PUBLIC) {
      await sock.sendMessage(remoteJid, {
        text: `🔒 Comandos públicos estão restritos a administradores neste grupo.`
      }, { quoted: msg });
      return true;
    }

    // 4. Verificação de Cadastro Obrigatório para Membros em Grupos
    const isRegCommand = ['cad', 'cadastrar', 'registro', 'registrar'].includes(command.name.toLowerCase());
    const isUserRegistered = userStore.isRegistered(senderJid);

    if (isGroup && !isRegCommand && !isUserRegistered && permissions.role === PERMISSIONS.PUBLIC) {
      let warn = `╭───────────────╮\n`;
      warn += `│ ❖ 𝐀𝐕𝐈𝐒𝐎 𝐃𝐄 𝐂𝐀𝐃𝐀𝐒𝐓𝐑𝐎 ❖\n`;
      warn += `│ ⚠️ Olá @${senderJid.split('@')[0]}!\n`;
      warn += `│ Você precisa estar cadastrado no bot para usar comandos.\n`;
      warn += `│ \n`;
      warn += `│ 👉 Cadastre-se com:\n`;
      warn += `│ *${activePrefix}cad <nome> <sexo> <idade>*\n`;
      warn += `│ _Exemplo_: *${activePrefix}cad Bárbara F 18*\n`;
      warn += `╰───────────────╯`;

      await sock.sendMessage(remoteJid, {
        text: warn,
        mentions: [senderJid]
      }, { quoted: msg });
      return true;
    }

    // 5. Executar comando básico
    try {
      const regUser = userStore.getUser(senderJid);
      const effectiveName = regUser?.name || pushName;
      logger.info(`[COMANDO] !${command.name} executado por ${effectiveName} (${senderJid}) [Cargo: ${permissions.role}] em ${remoteJid}`);
      await command.execute({
        text,
        commandName,
        args,
        rawArgs,
        msg,
        sock,
        remoteJid,
        senderJid,
        isGroup,
        pushName,
        userName: pushName,
        permissions,
        activePrefix
      });
      return true;
    } catch (err) {
      logger.error(`Erro ao executar comando !${command.name}: ${err.message}`);
      await sock.sendMessage(remoteJid, {
        text: `❌ Ocorreu um erro ao processar o comando ${activePrefix}${command.name}.`
      }, { quoted: msg });
      return true;
    }
  }
}

export const commandDispatcher = new CommandDispatcher();
