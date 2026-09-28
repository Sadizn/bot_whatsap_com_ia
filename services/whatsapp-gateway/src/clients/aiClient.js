import axios from 'axios';
import { config } from '../config/index.js';
import { configStore } from '../utils/configStore.js';
import { logger } from '../utils/logger.js';

class AIClient {
  constructor() {
    this.baseUrl = config.aiServiceUrl;
    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000 // 60s timeout para respostas de IA (garante margem para failover)
    });
  }

  async checkHealth() {
    try {
      const res = await this.http.get('/api/v1/health');
      return { online: true, data: res.data };
    } catch (error) {
      return { online: false, error: error.message };
    }
  }

  async processMessage({ userId, message, media = null, userName = '', isGroup = false }) {
    const currentConfig = configStore.get();
    
    // Se a IA estiver desativada pelo toggle do Dashboard
    if (!currentConfig.ai?.enabled) {
      logger.info(`Mensagem recebida de ${userId}, mas a IA está desativada no Dashboard.`);
      return null;
    }

    try {
      const selectedPrompt = isGroup 
        ? (currentConfig.ai?.groupSystemPrompt || currentConfig.ai?.systemPromptGroup)
        : currentConfig.ai?.systemPrompt;

      const payload = {
        user_id: userId,
        message: message || '',
        media: media,
        user_name: userName,
        is_group: isGroup,
        system_prompt: selectedPrompt,
        model: currentConfig.ai?.model,
        api_key: currentConfig.ai?.apiKey || process.env.GEMINI_API_KEY
      };

      const res = await this.http.post('/api/v1/chat', payload);
      return res.data;
    } catch (error) {
      logger.error(`Erro ao comunicar com o motor de IA em Python: ${error.message}`);
      if (error.response?.data?.detail) {
        logger.error(`Detalhes do erro: ${JSON.stringify(error.response.data.detail)}`);
      }
      return {
        reply: "Opa, deu uma oscilação aqui na minha conexão agora há pouco! Pode mandar de novo?",
        source: "error"
      };
    }
  }

  async getConversations() {
    try {
      const res = await this.http.get('/api/v1/conversations');
      return res.data?.conversations || [];
    } catch (error) {
      logger.warn(`Não foi possível buscar conversas do Python: ${error.message}`);
      return [];
    }
  }

  async listAutomations() {
    try {
      const res = await this.http.get('/api/v1/automations');
      return res.data?.automations || [];
    } catch (error) {
      logger.warn(`Não foi possível listar automações do Python: ${error.message}`);
      return [];
    }
  }
}

export const aiClient = new AIClient();
