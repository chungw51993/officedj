import redis from '../util/redisClient';
import Logger from '../util/logger';

class DJDelta {
  constructor() {
    this.logger = Logger.getLogger('DJDelta');
    this.state = this.getInitialState();
    this._ready = this.initialize();
  }

  getInitialState() {
    return {
      user: {},
      current: {},
      queue: [],
      gong: 0,
      gongList: [],
      error: false,
      state: 'waitingForHost',
    };
  }

  async initialize(retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const state = await redis.getObject('djDeltaState');
        if (state) {
          this.state = { ...this.getInitialState(), ...state };
          this.logger.debug('Loaded DJ state from Redis');
          return;
        }
        await redis.setObject('djDeltaState', this.state);
        this.logger.debug('Initialized fresh DJ state in Redis');
        return;
      } catch (err) {
        this.logger.error(`Failed to load state (attempt ${attempt}/${retries}): ${err.message}`);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 2000 * attempt));
        }
      }
    }
    this.logger.error('Exhausted retries — using in-memory defaults (will sync on next setState)');
  }

  async ready() {
    return this._ready;
  }

  get(field) {
    if (this.state[field] !== undefined && this.state[field] !== null) {
      return this.state[field];
    }
    const defaults = this.getInitialState();
    if (defaults[field] !== undefined) {
      return defaults[field];
    }
    return null;
  }

  async set(field, value) {
    await this._ready;
    this.state[field] = value;
    await redis.setObject('djDeltaState', this.state);
  }

  async setState(state) {
    await this._ready;
    Object.keys(state).forEach((key) => {
      if (this.state[key] !== undefined) {
        this.state[key] = state[key];
      }
    });
    await redis.setObject('djDeltaState', this.state);
    return true;
  }

  async gonged(userId, track) {
    let {
      current,
      gong,
      gongList,
      queue,
    } = this.state;
    if (current.id !== track.id) {
      await this.set('current', track);
      gong = 0;
      gongList = [];
    }
    if (!gongList.includes(userId)) {
      if (gong >= 2) {
        gong = 0;
        gongList = [];
      } else {
        gong += 1;
        gongList.push(userId);
      }
      await this.setState({
        gong,
        gongList,
        queue,
      });
      return gong;
    }
    return false;
  }

  async addTrackToQueue(track) {
    const {
      current,
      queue,
    } = this.state;
    if (!current.id) {
      await this.setState({
        current:  track,
      });
    } else {
      queue.push(track);
      await this.setState({
        queue,
      });
    }
  }

  comingUpOnQueue(current) {
    const {
      queue,
    } = this.state;
    const {
      id,
    } = current;
    let currentIdx = -1;
    queue.forEach((track, idx) => {
      if (id === track.id) {
        currentIdx = idx;
      }
    });
    if (currentIdx !== -1) {
      return queue.slice(currentIdx + 1);
    }
    return [];
  }

  resetToInitialState() {
    this.state = this.getInitialState();
    redis.setObject('djDeltaState', this.state);
  }
}

export default new DJDelta();
