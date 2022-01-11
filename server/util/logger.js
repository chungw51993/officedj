import path from 'path';
import log4js from 'log4js';

const config = {
  appenders: {
    console: {
      type: 'console',
    },
    request: {
      type: 'file',
      filename: path.join(__dirname, '..', 'log', 'request.log'),
      maxLogSize: 10485760,
      backups: 3,
      compress: true,
    },
    djdelta: {
      type: 'file',
      filename: path.join(__dirname, '..', 'log', 'djdelta.log'),
      maxLogSize: 10485760,
      backups: 3,
      compress: true,
    },
  },
};

if (process.env.NODE_ENV !== 'DEV') {
  config.categories = {
    request: {
      appenders: ['console', 'request'],
      level: 'debug',
    },
    default: {
      appenders: ['console', 'djdelta'],
      level: 'debug',
    },
  };
} else {
  config.categories = {
    request: {
      appenders: ['console'],
      level: 'debug',
    },
    default: {
      appenders: ['console'],
      level: 'debug',
    },
  };
}

class Logger {
  constructor() {
    log4js.configure(config);
  }

  getLogger(logger) {
    return log4js.getLogger(logger);
  }
}

export default new Logger();