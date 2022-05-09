import redis from '../util/redisClient';

class Trivia {
  constructor() {
    this.state = this.getInitialState();
    this.initialize();
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
      questionMessage: {},
      error: false,
      state: 'waiting',
    };
  }

  async initialize() {
    const state = await redis.getObject('triviaState');
    if (state) {
      this.state = state;
    } else {
      redis.setObject('triviaState', this.state);
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
    await redis.setObject('triviaState', this.state);
    return true;
  }
}

export default new Trivia();
