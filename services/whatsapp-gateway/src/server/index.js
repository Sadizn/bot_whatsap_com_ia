import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import { wsManager } from './websocket.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createServer() {
  const app = express();
  const server = http.createServer(app);

  // Middlewares
  app.use(cors());
  app.use(express.json());

  // Servir arquivos estáticos do Dashboard Frontend
  const publicDir = path.resolve(__dirname, '../../public');
  app.use(express.static(publicDir));

  // Rotas da API
  app.use('/api', apiRoutes);

  // Fallback para SPA (Dashboard)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  // Inicializa WebSocket Server no mesmo servidor HTTP
  wsManager.init(server);

  return { app, server };
}
