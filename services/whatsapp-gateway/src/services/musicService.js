import axios from 'axios';
import ytSearch from 'yt-search';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

class MusicService {
  /**
   * Busca e resolve detalhes e áudio do YouTube com capa HD
   * @param {string} query - Termo de pesquisa ou URL do YouTube
   */
  async searchAndResolve(query) {
    if (!query || !query.trim()) {
      throw new Error('Termo de busca vazio.');
    }

    const cleanQuery = query.trim();
    logger.info(`[MUSIC SERVICE] Resolvendo áudio e capa para: "${cleanQuery}"`);

    // 1. Tenta extrair diretamente via Motor Python / yt-dlp
    try {
      const aiBaseUrl = config.aiServiceUrl || 'http://localhost:8000';
      const resolveUrl = `${aiBaseUrl}/api/v1/music/resolve`;
      
      const res = await axios.post(resolveUrl, { query: cleanQuery }, { timeout: 25000 });
      if (res.data && res.data.audioUrl) {
        logger.success(`[MUSIC SERVICE] Áudio resolvido com sucesso via yt-dlp para: "${res.data.title}"`);
        
        // Tenta baixar o buffer para envio garantido
        let buffer = null;
        try {
          const audioRes = await axios.get(res.data.audioUrl, {
            responseType: 'arraybuffer',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 35000
          });
          if (audioRes.data && audioRes.data.length > 0) {
            buffer = Buffer.from(audioRes.data);
            logger.info(`[MUSIC SERVICE] Buffer de áudio baixado com sucesso (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
          }
        } catch (downloadErr) {
          logger.warn(`[MUSIC SERVICE] Aviso ao baixar buffer: ${downloadErr.message}, usando stream URL direta`);
        }

        return {
          title: res.data.title,
          artist: res.data.artist || 'YouTube Music',
          duration: res.data.duration || '03:30',
          views: res.data.views || '',
          url: res.data.url,
          thumbnail: res.data.thumbnail,
          audioUrl: res.data.audioUrl,
          audioBuffer: buffer
        };
      }
    } catch (err) {
      logger.warn(`[MUSIC SERVICE] Falha no endpoint Python yt-dlp: ${err.message}. Tentando fallback local...`);
    }

    // 2. Fallback local com yt-search
    let ytResult = null;
    try {
      const searchRes = await ytSearch(cleanQuery);
      if (searchRes && searchRes.videos && searchRes.videos.length > 0) {
        const v = searchRes.videos[0];
        ytResult = {
          title: v.title,
          artist: v.author?.name || 'YouTube Music',
          duration: v.timestamp || '03:30',
          views: v.views ? v.views.toLocaleString('pt-BR') : '',
          url: v.url,
          thumbnail: v.thumbnail || v.image,
          audioUrl: null,
          audioBuffer: null
        };
      }
    } catch (err) {
      logger.warn(`[MUSIC SERVICE] Fallback yt-search falhou: ${err.message}`);
    }

    if (ytResult) {
      return ytResult;
    }

    throw new Error(`Nenhum áudio encontrado para "${cleanQuery}".`);
  }
}

export const musicService = new MusicService();
