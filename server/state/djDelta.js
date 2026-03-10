import redis from '../util/redisClient';

class DJDelta {
  constructor() {
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

  async initialize() {
    const state = await redis.getObject('djDeltaState');
    if (state) {
      this.state = { ...this.getInitialState(), ...state };
    } else {
      await redis.setObject('djDeltaState', this.state);
    }
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
