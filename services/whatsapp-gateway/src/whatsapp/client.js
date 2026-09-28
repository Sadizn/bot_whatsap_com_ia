import baileys from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import NodeCache from 'node-cache';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const makeWASocket = baileys.makeWASocket || (baileys.default && baileys.default.default) || baileys.default;
const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } = baileys;

const messageStore = new Map();
export const groupMetadataCache = new Map();
const msgRetryCounterCache = new NodeCache();

class WhatsAppClient {
  constructor() {
    this.sock = null;
    this.status = 'DISCONNECTED'; // DISCONNECTED | CONNECTING | AWAITING_QR_SCAN | AWAITING_PAIRING_CODE | CONNECTED
    this.qrCodeDataUrl = null;
    this.qrRaw = null;
    this.pairingCode = null;
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
        pairingCode: this.pairingCode,
        userInfo: this.userInfo,
        stats: this.stats
      });
    }
  }

  clearSession() {
    try {
      if (fs.existsSync(config.sessionDir)) {
        logger.info('Limpando dados e credenciais antigas da sessão do WhatsApp...');
        const files = fs.readdirSync(config.sessionDir);
        for (const file of files) {
          fs.rmSync(path.join(config.sessionDir, file), { recursive: true, force: true });
        }
        logger.success('Sessão anterior limpa com sucesso. Pronto para novo QR Code.');
      }
    } catch (err) {
      logger.error('Erro ao limpar diretório de sessão:', err.message);
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
        msgRetryCounterCache,
        browser: Browsers ? Browsers.windows('Desktop') : ['Edith Desktop', 'Chrome', '120.0.6099.217'],
        syncFullHistory: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        generateHighQualityLinkPreview: false,
        getMessage: async (key) => {
          if (key?.id && messageStore.has(key.id)) {
            return messageStore.get(key.id);
          }
          return {
            conversation: ''
          };
        },
        cachedGroupMetadata: async (jid) => {
          if (groupMetadataCache.has(jid)) {
            return groupMetadataCache.get(jid);
          }
          try {
            if (this.sock) {
              const meta = await this.sock.groupMetadata(jid);
              if (meta) {
                groupMetadataCache.set(jid, meta);
                return meta;
              }
            }
          } catch (e) {
            // Ignora falha ao obter metadados
          }
          return undefined;
        }
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
          this.isConnecting = false;
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
          this.pairingCode = null;
          this._notifyStatusChange();

          logger.warn(`Conexão do WhatsApp fechada. Código: ${statusCode}. Reconectando: ${shouldReconnect}`);

          if (isReplaced) {
            logger.warn('⚠️ A conexão foi substituída por outra sessão ativa. Clique em Reiniciar Conexão se desejar reconectar.');
          } else if (isLoggedOut) {
            logger.warn('❌ Sessão deslogada. Limpando credenciais antigas e gerando novo QR Code imediatamente...');
            this.clearSession();
            this.reconnectTimer = setTimeout(() => {
              this.start();
            }, 2000);
          } else if (shouldReconnect) {
            this.reconnectTimer = setTimeout(() => {
              this.start();
            }, 4000);
          }
        } else if (connection === 'open') {
          this.isConnecting = false;
          this.status = 'CONNECTED';
          this.qrCodeDataUrl = null;
          this.qrRaw = null;
          this.pairingCode = null;
          this.userInfo = this.sock.user;
          logger.success(`WhatsApp conectado com sucesso! Logado como: ${this.userInfo?.id || 'Desconhecido'}`);
          this._notifyStatusChange();
        }
      });

      // Eventos de mensagem recebida
      this.sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;

        for (const msg of m.messages) {
          if (msg.key?.id && msg.message) {
            messageStore.set(msg.key.id, msg.message);
            if (messageStore.size > 1000) {
              const oldest = messageStore.keys().next().value;
              messageStore.delete(oldest);
            }
          }

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

  async requestPairingCode(phoneNumber) {
    const cleanNumber = (phoneNumber || '').toString().replace(/\D/g, '');
    if (!cleanNumber || cleanNumber.length < 8) {
      throw new Error('Número de telefone inválido. Informe o código do país + DDD + número (Ex: 244923456789 ou 5511999999999).');
    }

    if (!this.sock) {
      this.start();
    }

    // Aguarda socket estar pronto para receber a requisição de emparelhamento
    let retries = 0;
    while ((!this.sock || typeof this.sock.requestPairingCode !== 'function') && retries < 15) {
      await new Promise(r => setTimeout(r, 400));
      retries++;
    }

    if (!this.sock || typeof this.sock.requestPairingCode !== 'function') {
      throw new Error('Socket WhatsApp não está disponível para gerar o código. Reinicie a conexão e tente novamente.');
    }

    try {
      logger.info(`Solicitando código de emparelhamento Baileys para: +${cleanNumber}`);
      const code = await this.sock.requestPairingCode(cleanNumber);
      this.pairingCode = code;
      this.status = 'AWAITING_PAIRING_CODE';
      this._notifyStatusChange();
      logger.success(`Código de emparelhamento gerado com sucesso: ${code}`);
      return code;
    } catch (err) {
      logger.error(`Erro ao gerar código de emparelhamento para ${cleanNumber}:`, err.message);
      throw err;
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
        logger.warn('Aviso ao deslogar socket:', err.message);
      }
      this.status = 'DISCONNECTED';
      this.qrCodeDataUrl = null;
      this.pairingCode = null;
      this.userInfo = null;
      this._notifyStatusChange();
    }
    // Limpa os arquivos antigos para que a próxima conexão gere o QR imediatamente
    this.clearSession();
    // Reinicia automaticamente para exibir o novo QR Code
    setTimeout(() => {
      this.start();
    }, 1500);
  }

  getStatus() {
    return {
      status: this.status,
      qr: this.qrCodeDataUrl,
      pairingCode: this.pairingCode,
      userInfo: this.userInfo,
      stats: this.stats
    };
  }
}

export const waClient = new WhatsAppClient();
