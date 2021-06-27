import redis from 'redis';

import Logger from '../util/logger';

class RedisClient {
  constructor() {
    this.logger = Logger.getLogger('RedisClient');
    this.client = redis.createClient();
    this.createListener();
  }

  createListener() {
    this.client.on('ready', () => {
      this.logger.debug('Redis client is ready');
    })
    this.client.on('connect', () => {
      this.logger.debug('Redis connection created!');
    });
    this.client.on('reconnect', () => {
      this.logger.debug('Redis is reconnecting');
    });
    this.client.on('error', (err) => {
      this.logger.error(err);
    });
  }

  set(key, value) {
    return new Promise((resolve) => {
      this.client.set(key, value, () => {
        resolve(true);
      });
    });
  }

  get(key) {
    return new Promise((resolve) => {
      this.client.get(key, resolve);
    });
  }

  setObject(key, object) {
    return new Promise((resolve, reject) => {
      if (!object || typeof object !== 'object') {
        this.logger.error('Object is not a valid object');
        return reject('Object is not a valid object');
      }
      const hset = [key];
      Object.keys(object).forEach((k) => {
        hset.push(k);
        if (typeof object[k] === 'string' || typeof object[k] === 'boolean') {
          hset.push(object[k]);
        } else {
          const buffer = Buffer.from(JSON.stringify(object[k]));
          hset.push(buffer);
        }
      });
      this.client.hset(hset);
      resolve(true);
    });
  }

  getObject(key) {
    return new Promise((resolve, reject) => {
      this.client.hgetall(key, (err, obj) => {
        if (err) {
          this.logger.error(err);
          return reject(err);
        }
        const object = {};
        if (obj) {
          Object.keys(obj).forEach((k) => {
            if (obj[k][0] === '{' || obj[k][0] === '[') {
              object[k] = JSON.parse(obj[k]);
            } else if (obj[k] === 'true' || obj[k] === 'false') {
              object[k] = obj[k] === 'true';
            } else if (obj[k] === 'null') {
              object[k] = null;
            } else if (obj[k].length > 0 && !isNaN(obj[k])) {
              object[k] = parseInt(obj[k]);
            } else {
              object[k] = obj[k];
            }
          });
          return resolve(object);
        }
        resolve(null);
      });
    });
  }
}

export default new RedisClient();
