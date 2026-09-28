import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../../config/users.json');

const INITIAL_USER_XP = 500; // Saldo inicial de XP para novos cadastros

class UserStore {
  constructor() {
    this.users = new Map();
    this.pendingProposals = new Map(); // toJid -> { fromJid, groupJid, timestamp, timer }
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          for (const [jid, data] of Object.entries(parsed)) {
            // Garante que todo usuário carregado tenha campo xp numérico
            if (typeof data.xp !== 'number') {
              data.xp = INITIAL_USER_XP;
            }
            if (!data.lastDaily) data.lastDaily = null;
            if (!data.lastWork) data.lastWork = null;
            if (!data.transfersToday || typeof data.transfersToday !== 'object') {
              data.transfersToday = { date: '', amount: 0 };
            }
            if (!data.betStats || typeof data.betStats !== 'object') {
              data.betStats = { totalBets: 0, wins: 0, losses: 0, xpBet: 0, xpWon: 0 };
            }
            if (!data.weeklyXp || typeof data.weeklyXp !== 'object') {
              data.weeklyXp = { weekKey: '', amount: 0 };
            }
            this.users.set(jid, data);
          }
          logger.info(`[USER STORE] Carregados ${this.users.size} usuários cadastrados com sistema de XP.`);
        }
      }
    } catch (err) {
      logger.error('[USER STORE] Erro ao carregar usuários:', err.message);
    }
  }

  save() {
    try {
      const obj = {};
      for (const [jid, data] of this.users.entries()) {
        obj[jid] = data;
      }
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (err) {
      logger.error('[USER STORE] Erro ao salvar usuários no disco:', err.message);
    }
  }

  normalizeJid(jid) {
    if (!jid) return '';
    return jid.replace(/:\d+/, '').trim();
  }

  isRegistered(jid) {
    const cleanJid = this.normalizeJid(jid);
    return this.users.has(cleanJid);
  }

  getUser(jid) {
    const cleanJid = this.normalizeJid(jid);
    const user = this.users.get(cleanJid);
    if (user) {
      if (typeof user.xp !== 'number') user.xp = INITIAL_USER_XP;
      if (!user.lastDaily) user.lastDaily = null;
      if (!user.lastWork) user.lastWork = null;
      if (!user.transfersToday || typeof user.transfersToday !== 'object') {
        user.transfersToday = { date: '', amount: 0 };
      }
      if (!user.betStats || typeof user.betStats !== 'object') {
        user.betStats = { totalBets: 0, wins: 0, losses: 0, xpBet: 0, xpWon: 0 };
      }
      if (!user.weeklyXp || typeof user.weeklyXp !== 'object') {
        user.weeklyXp = { weekKey: '', amount: 0 };
      }
    }
    return user || null;
  }

  register(jid, { name, gender, age, pushName }) {
    const cleanJid = this.normalizeJid(jid);
    const existing = this.users.get(cleanJid) || {};

    const cleanGender = (gender || 'O').toUpperCase();
    const formattedGender = cleanGender.startsWith('F') ? 'Feminino' : cleanGender.startsWith('M') ? 'Masculino' : 'Outro';
    const numAge = parseInt(age, 10) || 18;

    const userData = {
      jid: cleanJid,
      name: name.trim(),
      gender: formattedGender,
      genderCode: cleanGender[0] || 'O',
      age: numAge,
      pushName: pushName || name,
      xp: typeof existing.xp === 'number' ? existing.xp : INITIAL_USER_XP,
      lastDaily: existing.lastDaily || null,
      lastWork: existing.lastWork || null,
      transfersToday: existing.transfersToday || { date: '', amount: 0 },
      betStats: existing.betStats || { totalBets: 0, wins: 0, losses: 0, xpBet: 0, xpWon: 0 },
      weeklyXp: existing.weeklyXp || { weekKey: '', amount: 0 },
      registeredAt: existing.registeredAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      partner: existing.partner || null,
      relationshipDate: existing.relationshipDate || null
    };

    this.users.set(cleanJid, userData);
    this.save();
    logger.success(`[USER STORE] Usuário registrado: ${userData.name} (${cleanJid}) [${userData.gender}, ${userData.age} anos, ${userData.xp} XP]`);
    return userData;
  }

  // ==========================================
  // SISTEMA DE XP / ECONOMIA MODULAR
  // ==========================================
  getXp(jid) {
    const user = this.getUser(jid);
    if (!user) return INITIAL_USER_XP;
    return typeof user.xp === 'number' ? user.xp : INITIAL_USER_XP;
  }

  hasEnoughXp(jid, amount = 50) {
    const current = this.getXp(jid);
    return current >= amount;
  }

  deductXp(jid, amount = 50) {
    const cleanJid = this.normalizeJid(jid);
    let user = this.getUser(cleanJid);

    if (!user) {
      // Se não cadastrado formalmente mas existe JID, cria registro base
      user = {
        jid: cleanJid,
        name: 'Usuário',
        gender: 'Outro',
        age: 18,
        xp: INITIAL_USER_XP,
        registeredAt: new Date().toISOString()
      };
      this.users.set(cleanJid, user);
    }

    const currentXp = typeof user.xp === 'number' ? user.xp : INITIAL_USER_XP;

    if (currentXp < amount) {
      return {
        success: false,
        currentXp,
        needed: amount,
        difference: amount - currentXp
      };
    }

    user.xp = Math.max(0, currentXp - amount);
    user.updatedAt = new Date().toISOString();
    this.users.set(cleanJid, user);
    this.save();

    logger.info(`[XP SYSTEM] Descontados ${amount} XP de ${user.name} (${cleanJid}). Saldo restante: ${user.xp} XP`);

    return {
      success: true,
      deducted: amount,
      remainingXp: user.xp,
      previousXp: currentXp
    };
  }

  addXp(jid, amount) {
    if (typeof amount !== 'number' || amount <= 0) return this.getXp(jid);
    const cleanJid = this.normalizeJid(jid);
    let user = this.getUser(cleanJid);

    if (!user) {
      user = {
        jid: cleanJid,
        name: 'Usuário',
        gender: 'Outro',
        age: 18,
        xp: INITIAL_USER_XP,
        registeredAt: new Date().toISOString()
      };
    }

    user.xp = (user.xp || 0) + amount;
    user.updatedAt = new Date().toISOString();
    this.users.set(cleanJid, user);
    this.save();

    return user.xp;
  }

  // ==========================================
  // RELACIONAMENTOS / NAMORO
  // ==========================================
  proposeDating(fromJid, toJid, groupJid) {
    const cleanFrom = this.normalizeJid(fromJid);
    const cleanTo = this.normalizeJid(toJid);

    if (this.pendingProposals.has(cleanTo)) {
      const old = this.pendingProposals.get(cleanTo);
      if (old.timer) clearTimeout(old.timer);
    }

    const timer = setTimeout(() => {
      this.pendingProposals.delete(cleanTo);
    }, 120000);

    const proposal = {
      fromJid: cleanFrom,
      toJid: cleanTo,
      groupJid,
      timestamp: Date.now(),
      timer
    };

    this.pendingProposals.set(cleanTo, proposal);
    return proposal;
  }

  getProposal(toJid) {
    const cleanTo = this.normalizeJid(toJid);
    return this.pendingProposals.get(cleanTo) || null;
  }

  acceptDating(toJid) {
    const cleanTo = this.normalizeJid(toJid);
    const proposal = this.pendingProposals.get(cleanTo);
    if (!proposal) return null;

    if (proposal.timer) clearTimeout(proposal.timer);
    this.pendingProposals.delete(cleanTo);

    const userFrom = this.getUser(proposal.fromJid);
    const userTo = this.getUser(cleanTo);

    if (!userFrom || !userTo) return null;

    const now = new Date().toISOString();
    userFrom.partner = cleanTo;
    userFrom.relationshipDate = now;

    userTo.partner = proposal.fromJid;
    userTo.relationshipDate = now;

    this.users.set(proposal.fromJid, userFrom);
    this.users.set(cleanTo, userTo);
    this.save();

    return { userFrom, userTo, relationshipDate: now };
  }

  rejectDating(toJid) {
    const cleanTo = this.normalizeJid(toJid);
    const proposal = this.pendingProposals.get(cleanTo);
    if (!proposal) return null;

    if (proposal.timer) clearTimeout(proposal.timer);
    this.pendingProposals.delete(cleanTo);
    return proposal;
  }

  breakUp(jid) {
    const cleanJid = this.normalizeJid(jid);
    const user = this.getUser(cleanJid);
    if (!user || !user.partner) return null;

    const partnerJid = user.partner;
    const partner = this.getUser(partnerJid);

    user.partner = null;
    user.relationshipDate = null;
    this.users.set(cleanJid, user);

    if (partner) {
      partner.partner = null;
      partner.relationshipDate = null;
      this.users.set(partnerJid, partner);
    }

    this.save();
    return { user, partner, partnerJid };
  }

  getAll() {
    return Array.from(this.users.values());
  }
}

export const userStore = new UserStore();
