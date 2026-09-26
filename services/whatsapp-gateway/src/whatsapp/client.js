import baileys from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const makeWASocket = baileys.makeWASocket || (baileys.default && baileys.default.default) || baileys.default;
const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = baileys;

class WhatsAppClient {
  constructor() {
    this.sock = null;
    this.status = 'DISCONNECTED'; // DISCONNECTED | CONNECTING | AWAITING_QR_SCAN | CONNECTED
    this.qrCodeDataUrl = null;
    this.qrRaw = null;
    this.userInfo = null;
    this.onMessageCallback = null;
    this.onStatusChangeCallback = null;
    this.reconnectTimer = null;
    this.isConnecting = false;
    this.stats = {
      messagesReceived: 0,
      messagesSent: 0,
      startedAt: new Date().toISOString()
    };
  }

  setOnMessage(callback) {
    this.onMessageCallback = callback;
  }

  setOnStatusChange(callback) {
    this.onStatusChangeCallback = callback;
  }

  _notifyStatusChange() {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback({
        status: this.status,
        qr: this.qrCodeDataUrl,
        userInfo: this.userInfo,
        stats: this.stats
      });
    }
  }

  async start() {
    if (this.isConnecting) {
      logger.info('Tentativa de conexão já em andamento, ignorando chamada duplicada.');
      return;
    }

    this.isConnecting = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      // Limpar socket anterior se existir
      if (this.sock) {
        try {
          this.sock.ev.removeAllListeners();
          this.sock.end();
        } catch (e) {
          // Ignora erro ao fechar socket velho
        }
        this.sock = null;
      }

      this.status = 'CONNECTING';
      this._notifyStatusChange();
      logger.info('Iniciando cliente WhatsApp Baileys...');

      const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
      const { version, isLatest } = await fetchLatestBaileysVersion();
      logger.info(`Usando Baileys v${version.join('.')}, isLatest: ${isLatest}`);

      this.sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        browser: ['Dashboard Bot', 'Chrome', '1.0.0'],
        syncFullHistory: false, // Evita sincronizar histórico pesado na inicialização
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000
      });

      // Salvar credenciais atualizadas
      this.sock.ev.on('creds.update', saveCreds);

      // Atualizações de conexão
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrRaw = qr;
          try {
            this.qrCodeDataUrl = await QRCode.toDataURL(qr);
          } catch (err) {
            logger.error('Erro ao converter QR Code para DataURL:', err.message);
          }
          this.status = 'AWAITING_QR_SCAN';
          logger.info('Novo QR Code gerado. Aguardando leitura pelo WhatsApp.');
          this._notifyStatusChange();
        }

        if (connection === 'close') {
          this.isConnecting = false;
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const isReplaced = statusCode === 440; // connectionReplaced
          const isLoggedOut = statusCode === DisconnectReason.loggedOut; // 401
          const shouldReconnect = !isLoggedOut && !isReplaced;

          this.status = 'DISCONNECTED';
          this.qrCodeDataUrl = null;
          this.qrRaw = null;
          this._notifyStatusChange();

          logger.warn(`Conexão do WhatsApp fechada. Código: ${statusCode}. Reconectando: ${shouldReconnect}`);

          if (isReplaced) {
            logger.warn('⚠️ A conexão foi substituída por outra sessão ativa (Código 440). O bot aguardará sua solicitação para reconectar.');
          } else if (isLoggedOut) {
            logger.error('❌ Sessão encerrada (Log out). Escaneie o QR Code novamente para conectar.');
          } else if (shouldReconnect) {
            // Aguarda 5 segundos antes de tentar reconectar para não sobrecarregar
            this.reconnectTimer = setTimeout(() => {
              this.start();
            }, 5000);
          }
        } else if (connection === 'open') {
          this.isConnecting = false;
          this.status = 'CONNECTED';
          this.qrCodeDataUrl = null;
          this.qrRaw = null;
          this.userInfo = this.sock.user;
          logger.success(`WhatsApp conectado com sucesso! Logado como: ${this.userInfo?.id || 'Desconhecido'}`);
          this._notifyStatusChange();
        }
      });

      // Eventos de mensagem recebida
      this.sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;

        for (const msg of m.messages) {
          // Ignora mensagens enviadas pelo próprio bot ou de status/broadcast
          if (msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') continue;

          this.stats.messagesReceived++;
          if (this.onMessageCallback) {
            try {
              await this.onMessageCallback(msg, this.sock);
            } catch (err) {
              logger.error('Erro no processador de mensagens:', err.message);
            }
          }
        }
      });

    } catch (error) {
      this.isConnecting = false;
      this.status = 'ERROR';
      logger.error('Falha ao inicializar o WhatsApp:', error.message);
      this._notifyStatusChange();
    }
  }

  async sendTextMessage(to, text) {
    if (!this.sock || this.status !== 'CONNECTED') {
      throw new Error('Cliente WhatsApp não está conectado.');
    }
    const result = await this.sock.sendMessage(to, { text });
    this.stats.messagesSent++;
    return result;
  }

  async disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.sock) {
      try {
        await this.sock.logout();
      } catch (err) {
        logger.warn('Erro ao deslogar do socket:', err.message);
      }
      this.status = 'DISCONNECTED';
      this.qrCodeDataUrl = null;
      this.userInfo = null;
      this._notifyStatusChange();
    }
  }

  getStatus() {
    return {
      status: this.status,
      qr: this.qrCodeDataUrl,
      userInfo: this.userInfo,
      stats: this.stats
    };
  }
}

export const waClient = new WhatsAppClient();
