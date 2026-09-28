import { musicService } from '../../services/musicService.js';
import { userStore } from '../../modules/userStore.js';
import { economyService } from '../../modules/economyService.js';
import { PERMISSIONS } from '../../modules/permissionManager.js';
import { logger } from '../../utils/logger.js';

const PLAY_COST_XP = 50; // Custo de 50 XP por reprodução musical

export const playCommand = {
  name: 'play',
  aliases: ['tocar', 'musica', 'song', 'ytmusic'],
  category: 'music',
  description: 'Busca e reproduz música do YouTube com capa (Custa 50 XP)',
  permission: PERMISSIONS.PUBLIC,
  groupOnly: false,

  async execute({ msg, sock, remoteJid, senderJid, rawArgs }) {
    if (!rawArgs || !rawArgs.trim()) {
      await sock.sendMessage(remoteJid, {
        text: '🎵 *Como usar*: !play <nome da música ou artista>\n_Exemplo_: *!play Matuê 333*\n\n💸 *Custo*: 50 XP por música'
      }, { quoted: msg });
      return;
    }

    // 1. VERIFICAÇÃO PRÉVIA DE XP (Sem cobrar ainda)
    const userXp = userStore.getXp(senderJid);
    if (userXp < PLAY_COST_XP) {
      await sock.sendMessage(remoteJid, {
        text: `❌ *Você não possui XP suficiente para usar o !play.*\n\n💰 *Seu saldo atual*: ${userXp} XP\n💸 *Necessário*: ${PLAY_COST_XP} XP\n\n💡 _Ganhe mais XP conversando no grupo, jogando !quiz ou completando tarefas!_`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(remoteJid, {
      text: `🔍 _Buscando e baixando áudio:_ *"${rawArgs}"*...\n💸 _Taxa de ${PLAY_COST_XP} XP será aplicada ao iniciar a reprodução._`
    }, { quoted: msg });

    try {
      // 2. BUSCA E RESOLUÇÃO DA MÚSICA
      const track = await musicService.searchAndResolve(rawArgs);

      if (!track || (!track.audioBuffer && !track.audioUrl)) {
        throw new Error('Arquivo de áudio não disponível para esta faixa.');
      }

      // 3. COBRANÇA SEGURA APÓS RESOLUÇÃO BEM-SUCEDIDA
      const deduction = userStore.deductXp(senderJid, PLAY_COST_XP);
      if (!deduction.success) {
        await sock.sendMessage(remoteJid, {
          text: `❌ *Saldo insuficiente no momento da cobrança.*\n💰 Saldo: ${deduction.currentXp} XP\n💸 Necessário: ${PLAY_COST_XP} XP`
        }, { quoted: msg });
        return;
      }

      economyService.logTransaction({
        type: 'MUSIC_PLAY',
        userJid: senderJid,
        amount: -PLAY_COST_XP,
        balanceAfter: deduction.remainingXp,
        description: `Reprodução de música: ${track.title}`
      });

      // 4. MONTA CARD FORMATADO COM INFORMAÇÕES DE SALDO
      let caption = `╭───────────────╮\n`;
      caption += `│ ❖ 𝐄𝐃𝐈𝐓𝐇 𝐌𝐔́𝐒𝐈𝐂𝐀 ❖\n`;
      caption += `│ ✰ ❯ 𝐓𝐢́𝐭𝐮𝐥𝐨: ${track.title}\n`;
      caption += `│ ✰ ❯ 𝐀𝐫𝐭𝐢𝐬𝐭𝐚: ${track.artist}\n`;
      caption += `│ ✰ ❯ 𝐃𝐮𝐫𝐚𝐜̧𝐚̃𝐨: ${track.duration}\n`;
      caption += `│ ✰ ❯ 💸 𝐂𝐮𝐬𝐭𝐨: -${PLAY_COST_XP} XP\n`;
      caption += `│ ✰ ❯ 💰 𝐒𝐚𝐥𝐝𝐨: ${deduction.remainingXp.toLocaleString('pt-BR')} XP\n`;
      caption += `╰───────────────╯\n`;
      caption += `🎧 _Tocando agora: ${track.title}_`;

      // 5. Envia imagem de capa em alta resolução
      if (track.thumbnail) {
        await sock.sendMessage(remoteJid, {
          image: { url: track.thumbnail },
          caption
        }, { quoted: msg });
      }

      // 6. Envia o arquivo de áudio direto
      if (track.audioBuffer) {
        await sock.sendMessage(remoteJid, {
          audio: track.audioBuffer,
          mimetype: 'audio/mp4',
          ptt: false
        }, { quoted: msg });
      } else {
        await sock.sendMessage(remoteJid, {
          audio: { url: track.audioUrl },
          mimetype: 'audio/mp4',
          ptt: false
        }, { quoted: msg });
      }

      logger.success(`[PLAY COMMAND] Música "${track.title}" enviada para ${remoteJid}. Cobrado: 50 XP de ${senderJid}`);

    } catch (err) {
      // 7. EM CASO DE ERRO: NENHUM XP É COBRADO
      logger.error(`[PLAY COMMAND] Erro ao reproduzir "${rawArgs}": ${err.message}. Nenhum XP foi debitado.`);
      await sock.sendMessage(remoteJid, {
        text: `❌ Não foi possível carregar a música "${rawArgs}".\n🛡️ _Nenhum XP foi cobrado da sua conta._`
      }, { quoted: msg });
    }
  }
};
