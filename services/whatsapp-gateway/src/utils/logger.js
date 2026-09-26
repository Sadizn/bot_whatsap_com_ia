class AppLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 200;
  }

  log(level, message, meta = null) {
    const timestamp = new Date().toISOString();
    const entry = { timestamp, level, message, meta };
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    if (level === 'error') {
      console.error(prefix, message, meta || '');
    } else if (level === 'warn') {
      console.warn(prefix, message, meta || '');
    } else {
      console.log(prefix, message, meta || '');
    }
  }

  info(msg, meta) { this.log('info', msg, meta); }
  warn(msg, meta) { this.log('warn', msg, meta); }
  error(msg, meta) { this.log('error', msg, meta); }
  success(msg, meta) { this.log('success', msg, meta); }

  getRecentLogs(limit = 50) {
    return this.logs.slice(0, limit);
  }
}

export const logger = new AppLogger();
