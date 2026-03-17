import redis from '../util/redisClient';
import Logger from '../util/logger';

class Trivia {
  constructor() {
    this.logger = Logger.getLogger('Trivia');
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

  async initialize(retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const state = await redis.getObject('triviaState');
        if (state) {
          this.state = { ...this.getInitialState(), ...state };
          this.logger.debug('Loaded trivia state from Redis');
          return;
        }
        // Key genuinely missing — first boot
        await redis.setObject('triviaState', this.state);
        this.logger.debug('Initialized fresh trivia state in Redis');
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
      this.state[key] = state[key];
    });
    await redis.setObject('triviaState', this.state);
    return true;
  }
}

export default new Trivia();
