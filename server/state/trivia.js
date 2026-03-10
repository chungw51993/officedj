import redis from '../util/redisClient';

class Trivia {
  constructor() {
    this.state = this.getInitialState();
    this._ready = this.initialize();
  }

  getInitialState() {
    return {
      players: {},
      currentGameId: null,
      currentPlayers: {},
      currentQuestion: {},
      currentAnswers: {},
      currentRound: 1,
      correctAnswers: [],
      wrongAnswers: [],
      reminderMessage: {},
      questionMessage: {},
      selectedCategory: {},
      error: false,
      state: 'waiting',
      startCount: 0,
      startVoter: [],
      // Sudden death fields
      suddenDeathPlayers: {},
      suddenDeathRound: 0,
      // Game history
      gameHistory: [],
    };
  }

  async initialize() {
    const state = await redis.getObject('triviaState');
    if (state) {
      // Merge with initial state so new fields get defaults
      this.state = { ...this.getInitialState(), ...state };
    } else {
      await redis.setObject('triviaState', this.state);
    }
  }

  async ready() {
    return this._ready;
  }

  get(field) {
    if (this.state[field] !== undefined && this.state[field] !== null) {
      return this.state[field];
    }
    // Return defaults for known fields
    const defaults = this.getInitialState();
    if (defaults[field] !== undefined) {
      return defaults[field];
    }
    return null;
  }

  async setState(state) {
    await this._ready;
    Object.keys(state).forEach((key) => {
      // Allow setting new keys that exist in initial state
      this.state[key] = state[key];
    });
    await redis.setObject('triviaState', this.state);
    return true;
  }
}

export default new Trivia();
