import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { userStore } from './userStore.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TX_DB_PATH = path.resolve(__dirname, '../../config/transactions.json');

// Configurações Globais do Sistema de Economia
export const ECONOMY_CONFIG = {
  DAILY_COOLDOWN_MS: 24 * 60 * 60 * 1000, // 24 horas
  WORK_COOLDOWN_MS: 24 * 60 * 60 * 1000,  // 24 horas
  DAILY_MIN_XP: 250,
  DAILY_MAX_XP: 1000,
  WORK_MIN_XP: 50,
  WORK_MAX_XP: 3000,
  BET_MIN_XP: 50,
  BET_MAX_XP: 5000,
  BET_WIN_CHANCE: 0.45, // 45% de chance de vitória
  BET_MULTIPLIER: 2.0,  // Dobra o valor apostado
  MAX_DAILY_TRANSFER_XP: 1500 // Limite diário de transferência por remetente
};

// Trabalhos com textos criativos em português
const WORK_JOBS = [
  { title: 'Programador Fullstack', desc: '💻 Desenvolveu uma API escalável e corrigiu bugs críticos em produção' },
  { title: 'Barista Gourmet', desc: '☕ Preparou cafés especiais e cappuccinos artesanais na cafeteria' },
  { title: 'Entregador de App', desc: '🚚 Realizou 40 entregas expressas de moto sem nenhum atraso' },
  { title: 'Hacker Ético', desc: '🛡️ Encontrou uma falha de segurança zero-day e recebeu um bounty' },
  { title: 'Trader Financeiro', desc: '📈 Analisou o mercado cripto e fechou operações no verde' },
  { title: 'Mecânico Automotivo', desc: '🔧 Fez retífica de motor e alinhamento completo em supercarros' },
  { title: 'Chef de Alta Gastronomia', desc: '🍳 Cozinhou um banquete requintado de 5 pratos para clientes VIP' },
  { title: 'Designer Gráfico', desc: '🎨 Criou a identidade visual e animações 3D para uma grande marca' },
  { title: 'Streamer Gamer', desc: '🎮 Transmitiu 10 horas de campeonato ao vivo e recebeu muitos subs' },
  { title: 'Músico de Rua', desc: '🎸 Tocou violão acústico e cantou sucessos na praça central' },
  { title: 'Engenheiro Civil', desc: '🏗️ Supervisionou a concretagem e estrutura de um arranha-céu moderno' },
  { title: 'Fotógrafo Profissional', desc: '📸 Cobriu um ensaio internacional de moda em estúdio' },
  { title: 'Médico Plantonista', desc: '🏥 Fez um plantão noturno salvando vidas no hospital central' },
  { title: 'Piloto Comercial', desc: '✈️ Comandou um voo intercontinental com 350 passageiros em segurança' },
  { title: 'Especialista em Logística', desc: '📦 Otimizou as rotas de distribuição de um armazém inteligente' },
  { title: 'Detetive Particular', desc: '🕵️‍♂️ Resolveu um caso misterioso e apresentou provas irrefutáveis' },
  { title: 'Cientista de Dados', desc: '📊 Treinou modelos de aprendizado de máquina para previsões em tempo real' },
  { title: 'Eletricista Predial', desc: '⚡ Instalou todo o painel de energia solar de um condomínio fechado' }
];

class EconomyService {
  constructor() {
    this.transactions = [];
    this.loadTransactions();
  }

  loadTransactions() {
    try {
      if (fs.existsSync(TX_DB_PATH)) {
        const raw = fs.readFileSync(TX_DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.transactions = parsed;
          logger.info(`[ECONOMY] Carregadas ${this.transactions.length} transações históricas.`);
        }
      }
    } catch (err) {
      logger.error('[ECONOMY] Erro ao carregar transações:', err.message);
      this.transactions = [];
    }
  }

  saveTransactions() {
    try {
      const dir = path.dirname(TX_DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      // Mantém no máximo as últimas 1.000 transações para economizar memória e disco
      const toSave = this.transactions.slice(-1000);
      fs.writeFileSync(TX_DB_PATH, JSON.stringify(toSave, null, 2), 'utf-8');
    } catch (err) {
      logger.error('[ECONOMY] Erro ao salvar transações:', err.message);
    }
  }

  logTransaction({ type, userJid, counterpartyJid = null, amount, balanceAfter, description }) {
    const tx = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      type,
      userJid: userStore.normalizeJid(userJid),
      counterpartyJid: counterpartyJid ? userStore.normalizeJid(counterpartyJid) : null,
      amount,
      balanceAfter,
      description
    };
    this.transactions.push(tx);
    this.saveTransactions();
    return tx;
  }

  getTransactions(jid, limit = 5) {
    const cleanJid = userStore.normalizeJid(jid);
    return this.transactions
      .filter(tx => tx.userJid === cleanJid || tx.counterpartyJid === cleanJid)
      .slice(-limit)
      .reverse();
  }

  getAllTransactions(limit = 50) {
    return [...this.transactions].slice(-limit).reverse();
  }

  getTodayString() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Retorna a chave identificadora da semana de competição (Data da Segunda-feira da semana)
   * A temporada de ranking ocorre de Segunda (00:00) a Sábado (23:59).
   */
  getCurrentWeekKey() {
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay(); // 0 = Domingo, 1 = Segunda ... 6 = Sábado
    const diffToMonday = (dayNum === 0 ? -6 : 1 - dayNum);
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() + diffToMonday);
    return monday.toISOString().split('T')[0];
  }

  /**
   * Verifica se o dia atual é Domingo
   */
  isSunday() {
    return new Date().getDay() === 0;
  }

  /**
   * Registra ganho de XP aplicando as regras da temporada semanal:
   * - O saldo geral (carteira permanente) sempre é creditado.
   * - De Segunda a Sábado: adiciona ao ranking semanal da semana atual.
   * - No Domingo: não conta no ranking semanal e não acumula para segunda-feira.
   */
  recordXpGain(user, amount) {
    if (!user || typeof amount !== 'number' || amount <= 0) return;

    user.xp = (user.xp || 0) + amount;

    if (!this.isSunday()) {
      const currentWeekKey = this.getCurrentWeekKey();
      if (!user.weeklyXp || typeof user.weeklyXp !== 'object' || user.weeklyXp.weekKey !== currentWeekKey) {
        user.weeklyXp = { weekKey: currentWeekKey, amount: 0 };
      }
      user.weeklyXp.amount += amount;
    }
  }

  formatTimeRemaining(ms) {
    if (ms <= 0) return 'Pronto para uso';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes}min`);
    parts.push(`${seconds}s`);
    return parts.join(' ');
  }

  /**
   * Coleta a recompensa diária de XP
   */
  claimDaily(jid) {
    const cleanJid = userStore.normalizeJid(jid);
    const user = userStore.getUser(cleanJid);
    if (!user) {
      return { success: false, reason: 'NOT_REGISTERED' };
    }

    const now = Date.now();
    if (user.lastDaily) {
      const lastDailyTime = new Date(user.lastDaily).getTime();
      const elapsed = now - lastDailyTime;
      if (elapsed < ECONOMY_CONFIG.DAILY_COOLDOWN_MS) {
        const remainingMs = ECONOMY_CONFIG.DAILY_COOLDOWN_MS - elapsed;
        return {
          success: false,
          reason: 'COOLDOWN',
          remainingMs,
          formattedRemaining: this.formatTimeRemaining(remainingMs)
        };
      }
    }

    // Calcula recompensa aleatória entre min e max
    const reward = Math.floor(
      Math.random() * (ECONOMY_CONFIG.DAILY_MAX_XP - ECONOMY_CONFIG.DAILY_MIN_XP + 1)
    ) + ECONOMY_CONFIG.DAILY_MIN_XP;

    const oldBalance = user.xp || 0;
    this.recordXpGain(user, reward);
    user.lastDaily = new Date(now).toISOString();
    user.updatedAt = new Date(now).toISOString();

    userStore.users.set(cleanJid, user);
    userStore.save();

    this.logTransaction({
      type: 'DAILY',
      userJid: cleanJid,
      amount: reward,
      balanceAfter: user.xp,
      description: `Recompensa diária coletada (+${reward} XP)`
    });

    return {
      success: true,
      reward,
      oldBalance,
      newBalance: user.xp,
      isSunday: this.isSunday()
    };
  }

  /**
   * Executa uma jornada de trabalho para ganhar XP
   */
  work(jid) {
    const cleanJid = userStore.normalizeJid(jid);
    const user = userStore.getUser(cleanJid);
    if (!user) {
      return { success: false, reason: 'NOT_REGISTERED' };
    }

    const now = Date.now();
    if (user.lastWork) {
      const lastWorkTime = new Date(user.lastWork).getTime();
      const elapsed = now - lastWorkTime;
      if (elapsed < ECONOMY_CONFIG.WORK_COOLDOWN_MS) {
        const remainingMs = ECONOMY_CONFIG.WORK_COOLDOWN_MS - elapsed;
        return {
          success: false,
          reason: 'COOLDOWN',
          remainingMs,
          formattedRemaining: this.formatTimeRemaining(remainingMs)
        };
      }
    }

    // Seleciona profissão aleatória
    const job = WORK_JOBS[Math.floor(Math.random() * WORK_JOBS.length)];
    // Calcula remuneração entre 50 e 3000 XP
    const reward = Math.floor(
      Math.random() * (ECONOMY_CONFIG.WORK_MAX_XP - ECONOMY_CONFIG.WORK_MIN_XP + 1)
    ) + ECONOMY_CONFIG.WORK_MIN_XP;

    const oldBalance = user.xp || 0;
    this.recordXpGain(user, reward);
    user.lastWork = new Date(now).toISOString();
    user.updatedAt = new Date(now).toISOString();

    userStore.users.set(cleanJid, user);
    userStore.save();

    this.logTransaction({
      type: 'WORK',
      userJid: cleanJid,
      amount: reward,
      balanceAfter: user.xp,
      description: `Trabalho (${job.title}): +${reward} XP`
    });

    return {
      success: true,
      job,
      reward,
      oldBalance,
      newBalance: user.xp,
      isSunday: this.isSunday()
    };
  }

  /**
   * Realiza uma aposta de XP
   */
  placeBet(jid, amount) {
    const cleanJid = userStore.normalizeJid(jid);
    const user = userStore.getUser(cleanJid);
    if (!user) {
      return { success: false, reason: 'NOT_REGISTERED' };
    }

    if (!Number.isInteger(amount) || amount < ECONOMY_CONFIG.BET_MIN_XP) {
      return {
        success: false,
        reason: 'INVALID_AMOUNT',
        message: `O valor mínimo para apostar é ${ECONOMY_CONFIG.BET_MIN_XP} XP.`
      };
    }

    if (amount > ECONOMY_CONFIG.BET_MAX_XP) {
      return {
        success: false,
        reason: 'MAX_LIMIT_EXCEEDED',
        message: `O valor máximo por aposta é ${ECONOMY_CONFIG.BET_MAX_XP.toLocaleString('pt-BR')} XP.`
      };
    }

    const currentXp = user.xp || 0;
    if (currentXp < amount) {
      return {
        success: false,
        reason: 'INSUFFICIENT_FUNDS',
        currentXp,
        needed: amount,
        message: `Saldo insuficiente! Você tem ${currentXp.toLocaleString('pt-BR')} XP e tentou apostar ${amount.toLocaleString('pt-BR')} XP.`
      };
    }

    // Inicializa estatísticas de aposta se não existirem
    if (!user.betStats || typeof user.betStats !== 'object') {
      user.betStats = { totalBets: 0, wins: 0, losses: 0, xpBet: 0, xpWon: 0 };
    }

    const isWin = Math.random() < ECONOMY_CONFIG.BET_WIN_CHANCE;
    const now = new Date().toISOString();

    if (isWin) {
      const profit = Math.floor(amount * (ECONOMY_CONFIG.BET_MULTIPLIER - 1));
      const totalGain = amount + profit; // Multiplicador total (ex: 2x)
      
      this.recordXpGain(user, profit);
      user.betStats.totalBets += 1;
      user.betStats.wins += 1;
      user.betStats.xpBet += amount;
      user.betStats.xpWon += totalGain;
      user.updatedAt = now;

      userStore.users.set(cleanJid, user);
      userStore.save();

      this.logTransaction({
        type: 'BET_WIN',
        userJid: cleanJid,
        amount: profit,
        balanceAfter: user.xp,
        description: `Aposta vitoriosa (+${profit} XP de lucro)`
      });

      return {
        success: true,
        won: true,
        amount,
        profit,
        oldBalance: currentXp,
        newBalance: user.xp,
        stats: user.betStats,
        isSunday: this.isSunday()
      };
    } else {
      user.xp = Math.max(0, currentXp - amount);
      user.betStats.totalBets += 1;
      user.betStats.losses += 1;
      user.betStats.xpBet += amount;
      user.updatedAt = now;

      userStore.users.set(cleanJid, user);
      userStore.save();

      this.logTransaction({
        type: 'BET_LOSS',
        userJid: cleanJid,
        amount: -amount,
        balanceAfter: user.xp,
        description: `Aposta perdida (-${amount} XP)`
      });

      return {
        success: true,
        won: false,
        amount,
        lost: amount,
        oldBalance: currentXp,
        newBalance: user.xp,
        stats: user.betStats
      };
    }
  }

  /**
   * Transfere XP entre dois usuários cadastrados
   */
  transferXp(fromJid, toJid, amount) {
    const cleanFrom = userStore.normalizeJid(fromJid);
    const cleanTo = userStore.normalizeJid(toJid);

    if (cleanFrom === cleanTo) {
      return { success: false, reason: 'SELF_TRANSFER', message: 'Você não pode transferir XP para si mesmo!' };
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      return { success: false, reason: 'INVALID_AMOUNT', message: 'Informe um valor inteiro positivo para transferir.' };
    }

    const sender = userStore.getUser(cleanFrom);
    if (!sender) {
      return { success: false, reason: 'SENDER_NOT_REGISTERED', message: 'Você precisa estar cadastrado (!cad) para transferir XP.' };
    }

    const receiver = userStore.getUser(cleanTo);
    if (!receiver) {
      return { success: false, reason: 'RECEIVER_NOT_REGISTERED', message: 'O destinatário precisa estar cadastrado (!cad) no bot.' };
    }

    const senderXp = sender.xp || 0;
    if (senderXp < amount) {
      return {
        success: false,
        reason: 'INSUFFICIENT_FUNDS',
        message: `Saldo insuficiente. Você possui ${senderXp.toLocaleString('pt-BR')} XP.`
      };
    }

    // Validação do Limite Diário de 1.500 XP
    const todayStr = this.getTodayString();
    if (!sender.transfersToday || sender.transfersToday.date !== todayStr) {
      sender.transfersToday = { date: todayStr, amount: 0 };
    }

    const currentTransferred = sender.transfersToday.amount || 0;
    const availableLimit = ECONOMY_CONFIG.MAX_DAILY_TRANSFER_XP - currentTransferred;

    if (amount > availableLimit) {
      return {
        success: false,
        reason: 'DAILY_LIMIT_EXCEEDED',
        availableLimit,
        maxLimit: ECONOMY_CONFIG.MAX_DAILY_TRANSFER_XP,
        message: `Limite diário de transferências excedido! Você só pode enviar mais ${availableLimit.toLocaleString('pt-BR')} XP hoje (Limite: ${ECONOMY_CONFIG.MAX_DAILY_TRANSFER_XP.toLocaleString('pt-BR')} XP/dia).`
      };
    }

    // Execução Atômica
    const now = new Date().toISOString();
    sender.xp -= amount;
    sender.transfersToday.amount += amount;
    sender.updatedAt = now;

    // Creditando destinatário
    this.recordXpGain(receiver, amount);
    receiver.updatedAt = now;

    userStore.users.set(cleanFrom, sender);
    userStore.users.set(cleanTo, receiver);
    userStore.save();

    // Logs de auditoria para ambos os lados
    this.logTransaction({
      type: 'TRANSFER_SENT',
      userJid: cleanFrom,
      counterpartyJid: cleanTo,
      amount: -amount,
      balanceAfter: sender.xp,
      description: `Transferência enviada para @${cleanTo.split('@')[0]}`
    });

    this.logTransaction({
      type: 'TRANSFER_RECEIVED',
      userJid: cleanTo,
      counterpartyJid: cleanFrom,
      amount: amount,
      balanceAfter: receiver.xp,
      description: `Transferência recebida de @${cleanFrom.split('@')[0]}`
    });

    return {
      success: true,
      amount,
      sender,
      receiver,
      senderBalance: sender.xp,
      receiverBalance: receiver.xp,
      remainingDailyLimit: ECONOMY_CONFIG.MAX_DAILY_TRANSFER_XP - sender.transfersToday.amount
    };
  }

  /**
   * Adiciona XP por ação administrativa
   */
  adminAddXp(targetJid, amount, adminJid) {
    const cleanTarget = userStore.normalizeJid(targetJid);
    const user = userStore.getUser(cleanTarget);
    if (!user) {
      return { success: false, reason: 'USER_NOT_FOUND' };
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      return { success: false, reason: 'INVALID_AMOUNT' };
    }

    this.recordXpGain(user, amount);
    user.updatedAt = new Date().toISOString();
    userStore.users.set(cleanTarget, user);
    userStore.save();

    this.logTransaction({
      type: 'ADMIN_ADD',
      userJid: cleanTarget,
      counterpartyJid: userStore.normalizeJid(adminJid),
      amount: amount,
      balanceAfter: user.xp,
      description: `XP adicionado pelo administrador`
    });

    return { success: true, user, addedAmount: amount, newBalance: user.xp };
  }

  /**
   * Remove XP por ação administrativa
   */
  adminRemoveXp(targetJid, amount, adminJid) {
    const cleanTarget = userStore.normalizeJid(targetJid);
    const user = userStore.getUser(cleanTarget);
    if (!user) {
      return { success: false, reason: 'USER_NOT_FOUND' };
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      return { success: false, reason: 'INVALID_AMOUNT' };
    }

    const currentXp = user.xp || 0;
    const actualDeduction = Math.min(currentXp, amount);
    user.xp = Math.max(0, currentXp - amount);
    user.updatedAt = new Date().toISOString();
    userStore.users.set(cleanTarget, user);
    userStore.save();

    this.logTransaction({
      type: 'ADMIN_REMOVE',
      userJid: cleanTarget,
      counterpartyJid: userStore.normalizeJid(adminJid),
      amount: -actualDeduction,
      balanceAfter: user.xp,
      description: `XP removido pelo administrador`
    });

    return { success: true, user, removedAmount: actualDeduction, newBalance: user.xp };
  }

  /**
   * Consulta os dados detalhados da carteira do usuário
   */
  getWallet(jid) {
    const cleanJid = userStore.normalizeJid(jid);
    const user = userStore.getUser(cleanJid);
    if (!user) return null;

    const now = Date.now();
    const todayStr = this.getTodayString();
    const currentWeekKey = this.getCurrentWeekKey();

    // Diária
    let dailyStatus = 'Disponível';
    let dailyReady = true;
    if (user.lastDaily) {
      const elapsedDaily = now - new Date(user.lastDaily).getTime();
      if (elapsedDaily < ECONOMY_CONFIG.DAILY_COOLDOWN_MS) {
        dailyReady = false;
        dailyStatus = this.formatTimeRemaining(ECONOMY_CONFIG.DAILY_COOLDOWN_MS - elapsedDaily);
      }
    }

    // Trabalho
    let workStatus = 'Disponível';
    let workReady = true;
    if (user.lastWork) {
      const elapsedWork = now - new Date(user.lastWork).getTime();
      if (elapsedWork < ECONOMY_CONFIG.WORK_COOLDOWN_MS) {
        workReady = false;
        workStatus = this.formatTimeRemaining(ECONOMY_CONFIG.WORK_COOLDOWN_MS - elapsedWork);
      }
    }

    // Limite de transferência
    const transferTodayAmount = (user.transfersToday?.date === todayStr)
      ? (user.transfersToday.amount || 0)
      : 0;
    const transferLimitRemaining = Math.max(0, ECONOMY_CONFIG.MAX_DAILY_TRANSFER_XP - transferTodayAmount);

    // Apostas
    const betStats = user.betStats || { totalBets: 0, wins: 0, losses: 0, xpBet: 0, xpWon: 0 };
    const winRate = betStats.totalBets > 0
      ? ((betStats.wins / betStats.totalBets) * 100).toFixed(1)
      : '0.0';

    const weeklyScore = (user.weeklyXp?.weekKey === currentWeekKey) ? (user.weeklyXp.amount || 0) : 0;

    return {
      user,
      xp: user.xp || 0,
      weeklyXp: weeklyScore,
      daily: { ready: dailyReady, status: dailyStatus },
      work: { ready: workReady, status: workStatus },
      transfers: {
        sentToday: transferTodayAmount,
        limitRemaining: transferLimitRemaining,
        maxDaily: ECONOMY_CONFIG.MAX_DAILY_TRANSFER_XP
      },
      betStats: {
        ...betStats,
        winRate: `${winRate}%`,
        profit: (betStats.xpWon || 0) - (betStats.xpBet || 0)
      }
    };
  }

  /**
   * Ranking Semanal de XP (Competição de Segunda a Sábado)
   * Zera todo final de semana / Domingo não conta.
   */
  getLeaderboard(limit = 10, callerJid = null) {
    const allUsers = userStore.getAll();
    const isSunday = this.isSunday();
    const currentWeekKey = this.getCurrentWeekKey();

    const usersWithWeekly = allUsers.map(u => {
      const isCurrentWeek = u.weeklyXp && u.weeklyXp.weekKey === currentWeekKey;
      const weeklyScore = isCurrentWeek ? (u.weeklyXp.amount || 0) : 0;
      return {
        ...u,
        weeklyXpAmount: weeklyScore
      };
    });

    // Ordenação pelo XP Semanal
    const sorted = [...usersWithWeekly].sort((a, b) => b.weeklyXpAmount - a.weeklyXpAmount);

    const top = sorted.slice(0, limit);
    let callerRank = null;

    if (callerJid) {
      const cleanCaller = userStore.normalizeJid(callerJid);
      const index = sorted.findIndex(u => userStore.normalizeJid(u.jid) === cleanCaller);
      if (index !== -1) {
        callerRank = {
          position: index + 1,
          user: sorted[index],
          xp: sorted[index].xp || 0,
          weeklyXp: sorted[index].weeklyXpAmount || 0
        };
      }
    }

    return { 
      top, 
      totalUsers: sorted.length, 
      callerRank,
      isSunday,
      currentWeekKey,
      seasonTitle: isSunday
        ? '🏖️ DOMINGO: FIM DE TEMPORADA'
        : '🏆 TEMPORADA SEMANAL (SEG - SÁB)'
    };
  }
}

export const economyService = new EconomyService();
