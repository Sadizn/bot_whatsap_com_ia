import { logger } from '../utils/logger.js';
import { groupMetadataCache } from '../whatsapp/client.js';
import { configStore } from '../utils/configStore.js';

export const PERMISSIONS = {
  PUBLIC: 'PUBLIC',
  ADMIN: 'ADMIN',
  OWNER: 'OWNER'
};

const PERMISSION_LEVELS = {
  [PERMISSIONS.PUBLIC]: 1,
  [PERMISSIONS.ADMIN]: 2,
  [PERMISSIONS.OWNER]: 3
};

class PermissionManager {
  cleanNumber(jidOrPhone) {
    if (!jidOrPhone || typeof jidOrPhone !== 'string') return '';
    return jidOrPhone.split('@')[0].split(':')[0].replace(/\D/g, '');
  }

  /**
   * Obtém os números configurados como Dono/Owner
   */
  getOwnerNumbers(sock) {
    const config = configStore.get();
    const configuredOwners = (config.ownerNumbers || []).map(n => this.cleanNumber(n));
    
    // Adiciona automaticamente o número conectado no socket do WhatsApp
    const botUserNumber = this.cleanNumber(sock?.user?.id);
    const botLidNumber = this.cleanNumber(sock?.user?.lid);

    if (botUserNumber && !configuredOwners.includes(botUserNumber)) {
      configuredOwners.push(botUserNumber);
    }
    if (botLidNumber && !configuredOwners.includes(botLidNumber)) {
      configuredOwners.push(botLidNumber);
    }

    return configuredOwners;
  }

  /**
   * Identifica o nível de permissão do usuário
   * @param {Object} params
   * @param {string} params.senderJid - JID do remetente
   * @param {string} params.groupJid - JID do grupo (se aplicável)
   * @param {Object} params.sock - Instância Baileys Socket
   * @returns {Promise<{ role: string, isOwner: boolean, isAdmin: boolean, isBotAdmin: boolean }>}
   */
  async getPermissions({ senderJid, groupJid, sock }) {
    const senderNumber = this.cleanNumber(senderJid);
    const isGroup = Boolean(groupJid && groupJid.endsWith('@g.us'));
    const ownerNumbers = this.getOwnerNumbers(sock);
    
    const isOwner = ownerNumbers.includes(senderNumber);

    if (!isGroup) {
      const role = isOwner ? PERMISSIONS.OWNER : PERMISSIONS.PUBLIC;
      return {
        role,
        isOwner,
        isAdmin: isOwner,
        isBotAdmin: false
      };
    }

    let isAdmin = isOwner;
    let isBotAdmin = false;
    const botUserNumber = this.cleanNumber(sock?.user?.id);
    const botLidNumber = this.cleanNumber(sock?.user?.lid);

    try {
      let metadata = groupMetadataCache.get(groupJid);
      if (!metadata && sock?.groupMetadata) {
        metadata = await sock.groupMetadata(groupJid);
        if (metadata) {
          groupMetadataCache.set(groupJid, metadata);
        }
      }

      if (metadata?.participants) {
        for (const p of metadata.participants) {
          const pNum = this.cleanNumber(p.id);
          const pIsAdmin = p.admin === 'admin' || p.admin === 'superadmin';

          if (pNum === senderNumber && pIsAdmin) {
            isAdmin = true;
          }

          if ((pNum === botUserNumber || pNum === botLidNumber) && pIsAdmin) {
            isBotAdmin = true;
          }
        }
      }
    } catch (err) {
      logger.warn(`Não foi possível verificar permissões do grupo ${groupJid}: ${err.message}`);
    }

    let role = PERMISSIONS.PUBLIC;
    if (isOwner) {
      role = PERMISSIONS.OWNER;
    } else if (isAdmin) {
      role = PERMISSIONS.ADMIN;
    }

    return {
      role,
      isOwner,
      isAdmin,
      isBotAdmin
    };
  }

  /**
   * Valida se a permissão do usuário satisfaz o nível requerido pelo comando
   * @param {string} userRole - Nível do usuário ('PUBLIC', 'ADMIN', 'OWNER')
   * @param {string} requiredRole - Nível requerido ('PUBLIC', 'ADMIN', 'OWNER')
   * @returns {boolean}
   */
  hasPermission(userRole, requiredRole = PERMISSIONS.PUBLIC) {
    const userLevel = PERMISSION_LEVELS[userRole] || 1;
    const requiredLevel = PERMISSION_LEVELS[requiredRole] || 1;
    return userLevel >= requiredLevel;
  }
}

export const permissionManager = new PermissionManager();
