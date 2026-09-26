import fs from 'fs';
import { config } from '../config/index.js';

class ConfigStore {
  constructor() {
    this.filePath = config.integrationsFile;
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (error) {
      console.error('Erro ao carregar integrations.json:', error.message);
    }
    // Padrão se arquivo não existir
    return {
      ai: {
        enabled: true,
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        temperature: 0.7,
        systemPrompt: 'Você é a Edith, conversando no WhatsApp de forma 100% natural, humana, amigável e descontraída, como uma pessoa real conversando com amigos no chat. Nunca fale que é uma IA. Não use clichês robóticos. Seja concisa com frases curtas e espontâneas (1 a 3 frases) e pontuação leve. Se alguém disser que você parece IA, leve no bom humor e aja de forma humana e leve.'
      },
      whatsapp: {
        autoReply: true,
        respondGroups: false,
        respondPrivate: true,
        prefixOnly: false,
        prefix: '!'
      },
      integrations: []
    };
  }

  get() {
    return this.data;
  }

  update(newData) {
    this.data = { ...this.data, ...newData };
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('Erro ao salvar integrations.json:', error.message);
      return false;
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
