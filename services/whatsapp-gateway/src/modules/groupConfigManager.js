import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../../');
const configFile = path.join(rootDir, 'config', 'group_configs.json');

const DEFAULT_GROUP_CONFIG = {
  enabledModules: {
    admin: true,
    games: true,
    music: true,
    utils: true
  },
  rules: '1. Respeitar todos os membros.\n2. Proibido conteúdo ofensivo ou spam.\n3. Divirtam-se!',
  welcomeMessage: 'Bem-vindo(a) ao grupo! Eu sou a Edith, digite !ajuda para ver os comandos disponíveis.'
};

class GroupConfigManager {
  constructor() {
    this.configs = this.load();
  }

  load() {
    try {
      if (fs.existsSync(configFile)) {
        const raw = fs.readFileSync(configFile, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      logger.error(`Erro ao carregar group_configs.json: ${err.message}`);
    }
    return {};
  }

  save() {
    try {
      fs.writeFileSync(configFile, JSON.stringify(this.configs, null, 2), 'utf-8');
      return true;
    } catch (err) {
      logger.error(`Erro ao salvar group_configs.json: ${err.message}`);
      return false;
    }
  }

  getGroupConfig(groupJid) {
    if (!this.configs[groupJid]) {
      return { ...DEFAULT_GROUP_CONFIG };
    }
    return {
      ...DEFAULT_GROUP_CONFIG,
      ...this.configs[groupJid],
      enabledModules: {
        ...DEFAULT_GROUP_CONFIG.enabledModules,
        ...(this.configs[groupJid].enabledModules || {})
      }
    };
  }

  updateGroupConfig(groupJid, updates) {
    const current = this.getGroupConfig(groupJid);
    this.configs[groupJid] = {
      ...current,
      ...updates,
      enabledModules: {
        ...current.enabledModules,
        ...(updates.enabledModules || {})
      }
    };
    return this.save();
  }

  isModuleEnabled(groupJid, moduleName) {
    if (!groupJid || !groupJid.endsWith('@g.us')) return true;
    const config = this.getGroupConfig(groupJid);
    return config.enabledModules?.[moduleName] !== false;
  }
}

export const groupConfigManager = new GroupConfigManager();
