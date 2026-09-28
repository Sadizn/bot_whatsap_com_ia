import { PERMISSIONS } from '../../modules/permissionManager.js';
import { configStore } from '../../utils/configStore.js';
import { userStore } from '../../modules/userStore.js';

export const helpCommand = {
  name: 'menu',
  aliases: ['ajuda', 'help', 'comandos', 'menumusic', 'menueconomia', 'menuxp', 'menugames', 'menuadmin', 'menuutil', 'menuia', 'menunamoro'],
  category: 'utils',
  description: 'Exibe o menu de comandos completo ou por categoria no estilo ornamental',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, senderJid, isGroup, permissions, commandName, userName }) {
    const groupConfig = isGroup ? configStore.getGroupConfig(remoteJid) : null;
    const p = (isGroup && groupConfig?.prefix) ? groupConfig.prefix : '!';
    const userRole = permissions?.role || 'PUBLIC';
    
    const regUser = userStore.getUser(senderJid);
    const uName = regUser?.name || (userName || 'Usuário').replace(/@.+/, '');
    const userXp = typeof regUser?.xp === 'number' ? regUser.xp : 0;

    const sub = (commandName || 'menu').toLowerCase();

    // Box de Informações do Bot e Usuário (sempre presente no topo)
    let infoBox = `╭───────────────╮\n`;
    infoBox += `│ ❖ 𝐈𝐍𝐅𝐎-𝐁𝐎𝐓/𝐔𝐒𝐄𝐑 ❖\n`;
    infoBox += `│ ✰ ❯ 𝐁𝐨𝐭: EDITH AI\n`;
    infoBox += `│ ✰ ❯ 𝐎𝐰𝐧𝐞𝐫: @MANANGA\n`;
    infoBox += `│ ✰ ❯ 𝐔𝐬𝐮𝐚́𝐫𝐢𝐨: ${uName}\n`;
    infoBox += `│ ✰ ❯ 𝐂𝐚𝐝𝐚𝐬𝐭𝐫𝐨: ${regUser ? '✅ Cadastrado' : `❌ Não (${p}cad)`}\n`;
    infoBox += `│ ✰ ❯ 𝐒𝐚𝐥𝐝𝐨: ${userXp.toLocaleString('pt-BR')} XP\n`;
    infoBox += `│ ✰ ❯ 𝐏𝐞𝐫𝐦𝐢𝐬𝐬𝐚̃𝐨: ${userRole}\n`;
    infoBox += `│ ✰ ❯ 𝐏𝐫𝐞𝐟𝐢𝐱𝐨: ${p}\n`;
    infoBox += `╰───────────────╯\n`;

    // Box de Diversos Menus
    let navBox = `╭───────────────╮\n`;
    navBox += `│ ❖ 𝐃𝐈𝐕𝐄𝐑𝐒𝐎𝐒 𝐌𝐄𝐍𝐔𝐒 ❖\n`;
    navBox += `│ ✰ ❯ ${p}menu (Menu Geral)\n`;
    navBox += `│ ✰ ❯ ${p}menueconomia (Economia, XP & Cassino)\n`;
    navBox += `│ ✰ ❯ ${p}menumusic (Músicas & YouTube)\n`;
    navBox += `│ ✰ ❯ ${p}menunamoro (Namoro & Casal)\n`;
    navBox += `│ ✰ ❯ ${p}menuutil (Utilitários & Ferramentas)\n`;
    navBox += `│ ✰ ❯ ${p}menuadmin (Administração de Grupos)\n`;
    navBox += `│ ✰ ❯ ${p}menugames (Jogos & Entretenimento)\n`;
    navBox += `│ ✰ ❯ ${p}menuia (Inteligência Artificial)\n`;
    navBox += `╰───────────────╯\n`;

    // Economia & XP
    let economyBox = `╭───────────────╮\n`;
    economyBox += `│ ❖ 𝐄𝐂𝐎𝐍𝐎𝐌𝐈𝐀 & 𝐗𝐏 ❖\n`;
    economyBox += `│ ✰ ❯ ${p}diaria (Coletar recompensa diária)\n`;
    economyBox += `│ ✰ ❯ ${p}trabalho (Trabalhar e receber salário)\n`;
    economyBox += `│ ✰ ❯ ${p}carteira (Ver saldo, status e timers)\n`;
    economyBox += `│ ✰ ❯ ${p}bet <valor> (Apostar no cassino 2.0x)\n`;
    economyBox += `│ ✰ ❯ ${p}enviar @membro <valor> (Transferir XP)\n`;
    economyBox += `│ ✰ ❯ ${p}ranking (Top 10 usuários mais ricos)\n`;
    economyBox += `│ ✰ ❯ ${p}extrato (Histórico recente de XP)\n`;
    if (permissions?.isAdmin || permissions?.isOwner) {
      economyBox += `│ ✰ ❯ ${p}addxp / ${p}removexp @membro <valor> [ADMIN]\n`;
    }
    economyBox += `╰───────────────╯\n`;

    // Categorias Específicas
    let regDatingBox = `╭───────────────╮\n`;
    regDatingBox += `│ ❖ 𝐂𝐀𝐃𝐀𝐒𝐓𝐑𝐎 & 𝐍𝐀𝐌𝐎𝐑𝐎 ❖\n`;
    regDatingBox += `│ ✰ ❯ ${p}cad <nome> <sexo> <idade> (Cadastrar perfil)\n`;
    regDatingBox += `│ ✰ ❯ ${p}perfil (Ver seu perfil e status)\n`;
    regDatingBox += `│ ✰ ❯ ${p}namorar @membro (Pedir em namoro)\n`;
    regDatingBox += `│ ✰ ❯ ${p}aceitar (Aceitar pedido de namoro)\n`;
    regDatingBox += `│ ✰ ❯ ${p}recusar (Recusar pedido de namoro)\n`;
    regDatingBox += `│ ✰ ❯ ${p}terminar (Terminar relacionamento)\n`;
    regDatingBox += `│ ✰ ❯ ${p}casal (Status do casal e tempo juntos)\n`;
    regDatingBox += `╰───────────────╯\n`;

    let musicBox = `╭───────────────╮\n`;
    musicBox += `│ ❖ 𝐂𝐌𝐃𝐒 𝐃𝐄 𝐌𝐔́𝐒𝐈𝐂𝐀 ❖\n`;
    musicBox += `│ ✰ ❯ ${p}play <nome/link> (YouTube + Capa HD • 50 XP)\n`;
    musicBox += `│ ✰ ❯ ${p}ytmp3 <link/nome> (Áudio MP3 Direto)\n`;
    musicBox += `│ ✰ ❯ ${p}ytmp4 <link/nome> (Vídeo MP4 HD)\n`;
    musicBox += `│ ✰ ❯ ${p}letra <música> (Letra Completa)\n`;
    musicBox += `╰───────────────╯\n`;

    let utilBox = `╭───────────────╮\n`;
    let utilHeader = isGroup ? '𝐂𝐌𝐃𝐒 𝐃𝐄 𝐌𝐄𝐌𝐁𝐑𝐎' : '𝐂𝐌𝐃𝐒 𝐔𝐓𝐈𝐋𝐈𝐓𝐀́𝐑𝐈𝐎𝐒';
    utilBox += `│ ❖ ${utilHeader} ❖\n`;
    utilBox += `│ ✰ ❯ ${p}ping (Latência e status do sistema)\n`;
    utilBox += `│ ✰ ❯ ${p}sticker / ${p}s (Criar figurinha de foto)\n`;
    utilBox += `│ ✰ ❯ ${p}clima <cidade> (Previsão meteorológica)\n`;
    utilBox += `│ ✰ ❯ ${p}calc <expressão> (Calculadora rápida)\n`;
    utilBox += `│ ✰ ❯ ${p}dado (Rolar dado de 6 faces)\n`;
    utilBox += `│ ✰ ❯ ${p}moeda (Cara ou Coroa)\n`;
    utilBox += `│ ✰ ❯ ${p}traduzir <idioma> <texto> (Tradução)\n`;
    utilBox += `╰───────────────╯\n`;

    let adminBox = `╭───────────────╮\n`;
    adminBox += `│ ❖ 𝐂𝐌𝐃𝐒 𝐃𝐄 𝐀𝐃𝐌𝐈𝐍 ❖\n`;
    adminBox += `│ ✰ ❯ ${p}grupo <abrir|fechar> [ADMIN]\n`;
    adminBox += `│ ✰ ❯ ${p}kick @membro (Remover participante) [ADMIN]\n`;
    adminBox += `│ ✰ ❯ ${p}regras (Regras ativas do grupo)\n`;
    adminBox += `│ ✰ ❯ ${p}status (Diagnóstico de conexões)\n`;
    adminBox += `╰───────────────╯\n`;

    let gamesBox = `╭───────────────╮\n`;
    gamesBox += `│ ❖ 𝐉𝐎𝐆𝐎𝐒 & 𝐋𝐀𝐙𝐄𝐑 ❖\n`;
    gamesBox += `│ ✰ ❯ ${p}quiz (Perguntas e respostas com opções)\n`;
    gamesBox += `│ ✰ ❯ ${p}trivia (Curiosidades aleatórias)\n`;
    gamesBox += `│ ✰ ❯ ${p}piada (Piada inteligente e engraçada)\n`;
    gamesBox += `╰───────────────╯\n`;

    let aiBox = `╭───────────────╮\n`;
    aiBox += `│ ❖ 𝐈𝐍𝐓𝐄𝐋𝐈𝐆𝐄̂𝐍𝐂𝐈𝐀 𝐀𝐑𝐓𝐈𝐅𝐈𝐂𝐈𝐀𝐋 ❖\n`;
    aiBox += `│ ✰ ❯ ${p}ia <pergunta> (Consulta direta Gemini)\n`;
    aiBox += `│ ✰ ❯ Conversa Livre: Fale naturalmente chamando "Edith"\n`;
    aiBox += `╰───────────────╯\n`;

    let responseText = '';

    if (sub === 'menueconomia' || sub === 'menuxp') {
      responseText = `${infoBox}${economyBox}`;
    } else if (sub === 'menumusic') {
      responseText = `${infoBox}${musicBox}`;
    } else if (sub === 'menunamoro') {
      responseText = `${infoBox}${regDatingBox}`;
    } else if (sub === 'menuutil') {
      responseText = `${infoBox}${utilBox}`;
    } else if (sub === 'menuadmin') {
      responseText = `${infoBox}${adminBox}`;
    } else if (sub === 'menugames') {
      responseText = `${infoBox}${gamesBox}`;
    } else if (sub === 'menuia') {
      responseText = `${infoBox}${aiBox}`;
    } else {
      // Menu Geral Completo
      responseText = `${infoBox}${navBox}${economyBox}${regDatingBox}${musicBox}${utilBox}${adminBox}${gamesBox}${aiBox}`;
    }

    await sock.sendMessage(remoteJid, { text: responseText.trim() }, { quoted: msg });
  }
};
