import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../../');
const envPath = path.join(rootDir, '.env');

function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  const output = { ...target };

  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target ? target[key] : undefined;

    if (srcVal && typeof srcVal === 'object' && !Array.isArray(srcVal)) {
      output[key] = deepMerge(tgtVal || {}, srcVal);
    } else if (srcVal !== undefined) {
      output[key] = srcVal;
    }
  }
  return output;
}

const DEFAULT_GROUP_CONFIG = {
  enabled: true,
  prefix: '!',
  allowPublicCommands: true,
  description: 'Grupo WhatsApp'
};

class ConfigStore {
  constructor() {
    this.filePath = config.integrationsFile;
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.groups) parsed.groups = {};
        if (!parsed.ownerNumbers) parsed.ownerNumbers = [];
        return parsed;
      }
    } catch (error) {
      console.error('Erro ao carregar integrations.json:', error.message);
    }
    
    // Padrão se arquivo não existir
    return {
      ai: {
        enabled: true,
        provider: 'gemini',
        model: 'gemini-3.5-flash-lite',
        temperature: 0.7,
        systemPrompt: 'Você é a Edith, assistente pessoal do Mananga (João Mananga), conversando no WhatsApp em nome dele. Seja natural, humana e espontânea. REGRA DE ESCALAÇÃO: Se o assunto depender de decisão direta do Mananga ou você não souber, diga: "O Mananga de momento não consegue te responder, mas ele responderá em breve, aqui é a assistente pessoal Edith falando por ele."',
        groupSystemPrompt: 'Você é a Edith. Você é uma participante autêntica, descontraída e querida deste grupo no WhatsApp. REGRA ABSOLUTA: No grupo você NÃO é assistente pessoal de ninguém nem do Mananga, você fala por si mesma como a própria Edith. Responda com simpatia, naturalidade, respostas curtas (1 a 3 frases) e emojis sutis.'
      },
      whatsapp: {
        autoReply: true,
        respondGroups: true,
        respondPrivate: true,
        prefixOnly: false,
        prefix: '!'
      },
      ownerNumbers: [],
      groups: {},
      integrations: []
    };
  }

  get() {
    return this.data;
  }

  update(newData) {
    this.data = deepMerge(this.data, newData);
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
      
      // Se vier uma chave de API ou modelo, sincroniza também no .env
      if (newData?.ai?.apiKey || newData?.ai?.model) {
        this.updateEnvFile(newData.ai.apiKey, newData.ai.model);
      }

      return true;
    } catch (error) {
      console.error('Erro ao salvar integrations.json:', error.message);
      return false;
    }
  }

  // --- Suporte Nativo a Grupos ---

  getGroupConfig(groupJid) {
    if (!groupJid) return { ...DEFAULT_GROUP_CONFIG };
    const groupData = this.data.groups?.[groupJid] || {};
    return {
      ...DEFAULT_GROUP_CONFIG,
      ...groupData
    };
  }

  updateGroupConfig(groupJid, groupUpdates) {
    if (!groupJid) return false;
    if (!this.data.groups) {
      this.data.groups = {};
    }
    const current = this.getGroupConfig(groupJid);
    this.data.groups[groupJid] = {
      ...current,
      ...groupUpdates,
      updatedAt: new Date().toISOString()
    };
    return this.update(this.data);
  }

  listGroups() {
    return this.data.groups || {};
  }

  // --- Sincronização com .env ---

  updateEnvFile(apiKey, model) {
    try {
      if (!fs.existsSync(envPath)) return;
      let content = fs.readFileSync(envPath, 'utf-8');

      if (apiKey && apiKey.trim()) {
        const keyVal = apiKey.trim();
        if (content.includes('GEMINI_API_KEY=')) {
          content = content.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${keyVal}`);
        } else {
          content += `\nGEMINI_API_KEY=${keyVal}`;
        }
        process.env.GEMINI_API_KEY = keyVal;
      }

      if (model && model.trim()) {
        const modelVal = model.trim();
        if (content.includes('GEMINI_MODEL=')) {
          content = content.replace(/GEMINI_MODEL=.*/g, `GEMINI_MODEL=${modelVal}`);
        } else {
          content += `\nGEMINI_MODEL=${modelVal}`;
        }
        process.env.GEMINI_MODEL = modelVal;
      }

      fs.writeFileSync(envPath, content, 'utf-8');
    } catch (e) {
      console.error('Erro ao atualizar arquivo .env:', e.message);
    }
  }

  toggleIntegration(id, enabled) {
    if (this.data.integrations) {
      const item = this.data.integrations.find(i => i.id === id);
      if (item) {
        item.enabled = enabled;
        this.update(this.data);
        return true;
      }
    }
    return false;
  }
}

export const configStore = new ConfigStore();
