import { createServer } from './src/server/index.js';
import { waClient } from './src/whatsapp/client.js';
import { handleIncomingMessage } from './src/handlers/messageHandler.js';
import { config } from './src/config/index.js';
import { logger } from './src/utils/logger.js';

// Previne encerramento do processo em erros transitórios de rede ou socket do WhatsApp
process.on('unhandledRejection', (err) => {
  logger.warn(`Unhandled Rejection: ${err?.message || err}`);
});

process.on('uncaughtException', (err) => {
  logger.warn(`Uncaught Exception: ${err?.message || err}`);
});

async function bootstrap() {
  try {
    logger.info('=============================================');
    logger.info(`Iniciando ${config.botName}...`);
    logger.info('=============================================');

    // 1. Inicializa servidor HTTP & WebSocket
    const { server } = createServer();
    server.listen(config.port, () => {
      logger.success(`🚀 Dashboard disponível em: http://localhost:${config.port}`);
      logger.info(`📡 Comunicação com IA Python em: ${config.aiServiceUrl}`);
    });

    // 2. Conecta manipulador de mensagens ao cliente do WhatsApp
    waClient.setOnMessage(handleIncomingMessage);

    // 3. Inicia o cliente do WhatsApp
    await waClient.start();

  } catch (error) {
    logger.error('Erro fatal ao iniciar o serviço WhatsApp Gateway:', error.message);
    process.exit(1);
  }
}

bootstrap();
