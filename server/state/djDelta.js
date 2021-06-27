import redis from '../util/redisClient';

class DJDelta {
  constructor() {
    this.state = {
      user: {},
      playlistId: null,
      playlist: [],
      currentIdx: 0,
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

  async gonged(userId) {
    let {
      gong,
      gongList,
    } = this.state;
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
      return gong;
    }
    return false;
  }


  async addTrack(track) {
    const {
      playlist,
    } = this.state;
    playlist.push(track);
    await this.set('playlist', playlist);
  }

  currentTrack() {
    const {
      playlist,
      currentIdx,
    } = this.state;
    if (playlist[currentIdx]) {
      return playlist[currentIdx];
    }
    return null;
  }

  playlistQueue() {
    const {
      playlist,
      currentIdx,
    } = this.state;
    return playlist.slice(currentIdx + 1);
  }

  nextTrack() {
    const currentIdx = this.get('currentIdx');
    const playlist = this.get('playlist');
    if (playlist.length > 0) {
      const nextTrack = playlist.shift();
      current = nextTrack;
    } else {
      current = {};
    }
  }
}

export default new DJDelta();
