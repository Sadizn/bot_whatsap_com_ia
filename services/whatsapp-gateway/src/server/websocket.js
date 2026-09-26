import { WebSocketServer } from 'ws';
import { logger } from '../utils/logger.js';
import { waClient } from '../whatsapp/client.js';

class WSManager {
  constructor() {
    this.wss = null;
    this.clients = new Set();
  }

  init(server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      logger.info('Cliente conectado ao WebSocket do Dashboard.');

      // Envia estado inicial ao conectar
      const initialState = {
        type: 'INIT',
        payload: {
          whatsapp: waClient.getStatus(),
          logs: logger.getRecentLogs(30)
        }
      };
      ws.send(JSON.stringify(initialState));

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', (err) => {
        logger.warn('Erro na conexão WebSocket:', err.message);
        this.clients.delete(ws);
      });
    });

    // Conectar ao cliente do WhatsApp para enviar atualizações de status
    waClient.setOnStatusChange((statusData) => {
      this.broadcast('STATUS_UPDATE', statusData);
    });
  }

  broadcast(type, payload) {
    if (!this.wss) return;
    const msg = JSON.stringify({ type, payload });
    for (const client of this.clients) {
      if (client.readyState === 1) { // OPEN
        client.send(msg);
      }
    }
  }
}

export const wsManager = new WSManager();
