import redis from '../util/redisClient';

class DJDelta {
  constructor() {
    this.state = this.getInitialState();
    this.initialize();
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

  async setState(state) {
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
