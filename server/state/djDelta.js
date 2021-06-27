import redis from '../util/redisClient';

class DJDelta {
  constructor() {
    this.state = {
      user: {},
      current: {},
      queue: [],
      gong: 0,
      gongList: [],
      error: false,
    };
    this.initialize();
  }

  async initialize() {
    const state = await redis.getObject('djDeltaState');
    if (state) {
      this.state = state;
    } else {
      redis.setObject('djDeltaState', this.state);
    }
  }

  get(field) {
    if (this.state[field]) {
      return this.state[field];
    }
    return null;
  }

  async set(field, value) {
    if (this.state[field] !== undefined) {
      this.state[field] = value;
      await redis.setObject('djDeltaState', this.state);
      return true;
    }
    return false;
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
      await this.set('gong', gong);
      await this.set('gongList', gongList);
      await this.set('queue', queue);
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
      await this.set('current', track);
    }
    queue.push(track);
    await this.set('queue', queue);
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
    return queue;
  }
}

export default new DJDelta();
