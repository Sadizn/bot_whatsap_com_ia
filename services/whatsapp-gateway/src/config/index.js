import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega .env da raiz do projeto se existir
const rootDir = path.resolve(__dirname, '../../../../');
const envPath = path.join(rootDir, '.env');

dotenv.config({ path: envPath });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  env: process.env.NODE_ENV || 'development',
  dashboardPass: process.env.DASHBOARD_PASS || 'admin123',
  
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  
  sessionDir: path.resolve(__dirname, '../../auth_info_baileys'),
  integrationsFile: path.resolve(rootDir, 'config/integrations.json'),
  
  botName: process.env.BOT_NAME || 'Assistente Virtual',
  triggerPrefix: process.env.TRIGGER_PREFIX || '!',
  respondGroups: process.env.RESPOND_GROUPS === 'true',
  respondPrivate: process.env.RESPOND_PRIVATE !== 'false'
};
