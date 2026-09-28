import { pingCommand } from './utils/ping.js';
import { statusCommand } from './utils/status.js';
import { profileCommand } from './utils/profile.js';
import { helpCommand } from './utils/help.js';
import { rulesCommand } from './utils/rules.js';
import { stickerCommand } from './utils/sticker.js';
import { weatherCommand } from './utils/weather.js';
import { calcCommand } from './utils/calc.js';
import { diceCommand, coinCommand } from './utils/dice.js';
import { jokeCommand } from './utils/joke.js';
import { aiDirectCommand } from './utils/aiDirect.js';
import { translateCommand } from './utils/translate.js';
import { registerCommand } from './utils/register.js';
import { 
  datingCommand, 
  acceptDatingCommand, 
  rejectDatingCommand, 
  breakUpCommand, 
  coupleCommand 
} from './utils/dating.js';

import { groupCommand } from './admin/group.js';
import { closeGroupCommand, openGroupCommand } from './admin/groupState.js';
import { kickCommand } from './admin/kick.js';

import { quizCommand } from './games/quiz.js';
import { triviaCommand } from './games/trivia.js';

import { playCommand } from './music/play.js';
import { ytmp3Command } from './music/ytmp3.js';
import { ytmp4Command } from './music/ytmp4.js';
import { lyricsCommand } from './music/lyrics.js';
import { dailyCommand } from './economy/daily.js';
import { workCommand } from './economy/work.js';
import { betCommand } from './economy/bet.js';
import { transferCommand } from './economy/transfer.js';
import { walletCommand } from './economy/wallet.js';
import { rankingCommand } from './economy/ranking.js';
import { addXpCommand, removeXpCommand, extratoCommand } from './economy/adminXp.js';

import { logger } from '../utils/logger.js';

class CommandRegistry {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
    this.initDefaultCommands();
  }

  initDefaultCommands() {
    // 1. Cadastro & Perfil
    this.register(registerCommand);
    this.register(profileCommand);

    // 2. Namoro & Relacionamentos
    this.register(datingCommand);
    this.register(acceptDatingCommand);
    this.register(rejectDatingCommand);
    this.register(breakUpCommand);
    this.register(coupleCommand);

    // 3. Economia & XP
    this.register(dailyCommand);
    this.register(workCommand);
    this.register(betCommand);
    this.register(transferCommand);
    this.register(walletCommand);
    this.register(rankingCommand);
    this.register(addXpCommand);
    this.register(removeXpCommand);
    this.register(extratoCommand);

    // 4. Utils & Membro
    this.register(helpCommand);
    this.register(pingCommand);
    this.register(statusCommand);
    this.register(rulesCommand);
    this.register(stickerCommand);
    this.register(weatherCommand);
    this.register(calcCommand);
    this.register(diceCommand);
    this.register(coinCommand);
    this.register(translateCommand);
    this.register(aiDirectCommand);

    // 5. Música & YouTube
    this.register(playCommand);
    this.register(ytmp3Command);
    this.register(ytmp4Command);
    this.register(lyricsCommand);

    // 6. Admin & Gestão de Grupos
    this.register(groupCommand);
    this.register(closeGroupCommand);
    this.register(openGroupCommand);
    this.register(kickCommand);

    // 7. Jogos & Diversão
    this.register(quizCommand);
    this.register(triviaCommand);
    this.register(jokeCommand);
  }

  register(command) {
    if (!command.name) return;
    this.commands.set(command.name.toLowerCase(), command);
    if (Array.isArray(command.aliases)) {
      for (const alias of command.aliases) {
        this.aliases.set(alias.toLowerCase(), command.name.toLowerCase());
      }
    }
    logger.info(`[Comando Registrado]: !${command.name} (Categoria: ${command.category}, Permissão: ${command.permission || 'PUBLIC'})`);
  }

  get(nameOrAlias) {
    if (!nameOrAlias) return null;
    const lower = nameOrAlias.toLowerCase();
    if (this.commands.has(lower)) {
      return this.commands.get(lower);
    }
    const realName = this.aliases.get(lower);
    if (realName && this.commands.has(realName)) {
      return this.commands.get(realName);
    }
    return null;
  }

  getAll() {
    return Array.from(this.commands.values());
  }
}

export const commandRegistry = new CommandRegistry();
