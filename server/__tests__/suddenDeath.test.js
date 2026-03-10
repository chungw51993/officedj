// Mock external dependencies
jest.mock('../util/redisClient', () => ({
  __esModule: true,
  default: {
    getObject: jest.fn(),
    setObject: jest.fn(),
  },
}));

jest.mock('../util/slackClient', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      postMessage: jest.fn().mockResolvedValue({ message: { ts: '123' } }),
      postEphemeral: jest.fn().mockResolvedValue({}),
      updateMessage: jest.fn().mockResolvedValue({}),
      deleteOriginalMessage: jest.fn().mockResolvedValue({}),
      getAllChannelMembers: jest.fn().mockResolvedValue({ members: [] }),
      formTextSections: jest.fn((texts) => {
        if (typeof texts === 'string') texts = [texts];
        return texts.map(t => ({ type: 'section', text: { type: 'mrkdwn', text: t } }));
      }),
    })),
  };
});

jest.mock('../util/triviaClient', () => ({
  __esModule: true,
  default: {
    getTriviaQuestion: jest.fn().mockResolvedValue({
      question: 'Test question?',
      correctAnswer: 'A',
      incorrectAnswers: ['B', 'C', 'D'],
    }),
  },
}));

jest.mock('../util/logger', () => ({
  __esModule: true,
  default: {
    getLogger: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    })),
  },
}));

jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

import triviaState from '../state/trivia';

beforeEach(() => {
  jest.useFakeTimers();
  triviaState.state = {
    ...triviaState.getInitialState(),
    currentGameId: 'test-game',
  };
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// Helper to flush all pending timers and microtasks
async function flushTimersAndMicrotasks(rounds = 10) {
  for (let i = 0; i < rounds; i++) {
    jest.runAllTimers();
    await Promise.resolve();
  }
}

const triviaController = require('../controller/triviaController').default;

describe('Sudden Death - endGame tie detection', () => {
  it('enters sudden death when top scores are tied', async () => {
    triviaState.state.currentPlayers = {
      U1: { score: 10, answers: [] },
      U2: { score: 10, answers: [] },
      U3: { score: 5, answers: [] },
    };
    triviaState.state.players = {
      U1: { displayName: 'Alice' },
      U2: { displayName: 'Bob' },
      U3: { displayName: 'Charlie' },
    };

    const promise = triviaController.endGame();
    await flushTimersAndMicrotasks();
    await promise;

    expect(triviaState.state.state).toBe('suddenDeath');
    expect(Object.keys(triviaState.state.suddenDeathPlayers)).toHaveLength(2);
    expect(triviaState.state.suddenDeathPlayers.U1).toBeDefined();
    expect(triviaState.state.suddenDeathPlayers.U2).toBeDefined();
  });

  it('does not enter sudden death for a clear winner', async () => {
    triviaState.state.currentPlayers = {
      U1: { score: 15, answers: [] },
      U2: { score: 10, answers: [] },
    };
    triviaState.state.players = {
      U1: { displayName: 'Alice' },
      U2: { displayName: 'Bob' },
    };

    const promise = triviaController.endGame();
    await flushTimersAndMicrotasks();
    await promise;

    expect(triviaState.state.state).toBe('waiting');
    expect(triviaState.state.players.U1.wins).toBe(1);
  });

  it('updates lifetime scores for all scoring players', async () => {
    triviaState.state.currentPlayers = {
      U1: { score: 12, answers: [] },
      U2: { score: 8, answers: [] },
      U3: { score: 0, answers: [] },
    };
    triviaState.state.players = {
      U1: { displayName: 'Alice', lifeTimeScore: 10 },
      U2: { displayName: 'Bob', lifeTimeScore: 5 },
      U3: { displayName: 'Charlie' },
    };

    const promise = triviaController.endGame();
    await flushTimersAndMicrotasks();
    await promise;

    expect(triviaState.state.players.U1.lifeTimeScore).toBe(22);
    expect(triviaState.state.players.U2.lifeTimeScore).toBe(13);
  });
});

describe('Sudden Death - sendSuddenDeathResult', () => {
  it('declares winner when one player remains after eliminations', async () => {
    triviaState.state.suddenDeathPlayers = {
      U1: { id: 'U1', displayName: 'Alice' },
      U2: { id: 'U2', displayName: 'Bob' },
    };
    triviaState.state.currentQuestion = { correctAnswer: 'A' };
    triviaState.state.correctAnswers = ['U1'];
    triviaState.state.wrongAnswers = [{ id: 'U2', answer: 'B' }];
    triviaState.state.suddenDeathRound = 1;
    triviaState.state.players = {
      U1: { displayName: 'Alice' },
      U2: { displayName: 'Bob' },
    };
    triviaState.state.currentPlayers = {
      U1: { score: 10, answers: [] },
      U2: { score: 10, answers: [] },
    };

    const promise = triviaController.sendSuddenDeathResult();
    await flushTimersAndMicrotasks();
    await promise;

    expect(triviaState.state.state).toBe('waiting');
    expect(triviaState.state.players.U1.wins).toBe(1);
    expect(triviaState.state.players.U1.suddenDeathWins).toBe(1);
  });

  it('restores all players when everyone is eliminated', async () => {
    triviaState.state.suddenDeathPlayers = {
      U1: { id: 'U1', displayName: 'Alice' },
      U2: { id: 'U2', displayName: 'Bob' },
    };
    triviaState.state.currentQuestion = { correctAnswer: 'A' };
    triviaState.state.correctAnswers = [];
    triviaState.state.wrongAnswers = [
      { id: 'U1', answer: 'B' },
      { id: 'U2', answer: 'C' },
    ];
    triviaState.state.suddenDeathRound = 1;
    triviaState.state.state = 'suddenDeath';
    triviaState.state.players = {
      U1: { displayName: 'Alice' },
      U2: { displayName: 'Bob' },
    };

    // Spy on startSuddenDeath to prevent it from actually running (it needs real Slack formatting)
    const startSpy = jest.spyOn(triviaController, 'startSuddenDeath').mockResolvedValue();

    const promise = triviaController.sendSuddenDeathResult();
    await flushTimersAndMicrotasks();
    await promise;

    // All eliminated — players should be restored, not game over
    expect(Object.keys(triviaState.state.suddenDeathPlayers)).toHaveLength(2);
    expect(triviaState.state.suddenDeathPlayers.U1).toBeDefined();
    expect(triviaState.state.suddenDeathPlayers.U2).toBeDefined();
    expect(triviaState.state.suddenDeathRound).toBe(2);
    expect(triviaState.state.state).toBe('suddenDeath');
    // startSuddenDeath should have been queued
    expect(startSpy).toHaveBeenCalled();

    startSpy.mockRestore();
  });

  it('continues when nobody answered', async () => {
    triviaState.state.suddenDeathPlayers = {
      U1: { id: 'U1', displayName: 'Alice' },
      U2: { id: 'U2', displayName: 'Bob' },
    };
    triviaState.state.currentQuestion = { correctAnswer: 'A' };
    triviaState.state.correctAnswers = [];
    triviaState.state.wrongAnswers = [];
    triviaState.state.suddenDeathRound = 2;
    triviaState.state.players = {
      U1: { displayName: 'Alice' },
      U2: { displayName: 'Bob' },
    };

    const promise = triviaController.sendSuddenDeathResult();
    await flushTimersAndMicrotasks();
    await promise;

    expect(Object.keys(triviaState.state.suddenDeathPlayers)).toHaveLength(2);
    expect(triviaState.state.suddenDeathRound).toBe(3);
  });

  it('eliminates non-answerers when some answered correctly', async () => {
    triviaState.state.suddenDeathPlayers = {
      U1: { id: 'U1', displayName: 'Alice' },
      U2: { id: 'U2', displayName: 'Bob' },
      U3: { id: 'U3', displayName: 'Charlie' },
    };
    triviaState.state.currentQuestion = { correctAnswer: 'A' };
    triviaState.state.correctAnswers = ['U1'];
    triviaState.state.wrongAnswers = [];
    triviaState.state.suddenDeathRound = 1;
    triviaState.state.players = {
      U1: { displayName: 'Alice' },
      U2: { displayName: 'Bob' },
      U3: { displayName: 'Charlie' },
    };
    triviaState.state.currentPlayers = {
      U1: { score: 10, answers: [] },
      U2: { score: 10, answers: [] },
      U3: { score: 10, answers: [] },
    };

    const promise = triviaController.sendSuddenDeathResult();
    await flushTimersAndMicrotasks();
    await promise;

    // U1 was the only answerer — U2 and U3 eliminated — U1 wins
    expect(triviaState.state.state).toBe('waiting');
    expect(triviaState.state.players.U1.wins).toBe(1);
  });
});

describe('Sudden Death - handleTriviaAnswer in sudden death mode', () => {
  it('tracks correct answer for sudden death player', () => {
    triviaState.state.state = 'suddenDeath';
    triviaState.state.currentGameId = 'game-1';
    triviaState.state.currentQuestion = { correctAnswer: 'Paris' };
    triviaState.state.suddenDeathPlayers = {
      U1: { id: 'U1', displayName: 'Alice' },
    };
    triviaState.state.correctAnswers = [];
    triviaState.state.wrongAnswers = [];

    triviaController.handleTriviaAnswer('U1', {
      gameId: 'game-1',
      answer: 'Paris',
      correctAnswer: 'Paris',
      difficulty: 'hard',
      question: 'What is the capital of France?',
      category: 'geography',
    });

    expect(triviaState.state.correctAnswers).toContain('U1');
  });

  it('tracks wrong answer for sudden death player', () => {
    triviaState.state.state = 'suddenDeath';
    triviaState.state.currentGameId = 'game-1';
    triviaState.state.currentQuestion = { correctAnswer: 'Paris' };
    triviaState.state.suddenDeathPlayers = {
      U1: { id: 'U1', displayName: 'Alice' },
    };
    triviaState.state.correctAnswers = [];
    triviaState.state.wrongAnswers = [];

    triviaController.handleTriviaAnswer('U1', {
      gameId: 'game-1',
      answer: 'London',
      correctAnswer: 'Paris',
      difficulty: 'hard',
      question: 'What is the capital of France?',
      category: 'geography',
    });

    expect(triviaState.state.wrongAnswers).toHaveLength(1);
    expect(triviaState.state.wrongAnswers[0].id).toBe('U1');
  });

  it('ignores answers from non-sudden-death players', () => {
    triviaState.state.state = 'suddenDeath';
    triviaState.state.currentGameId = 'game-1';
    triviaState.state.currentQuestion = { correctAnswer: 'Paris' };
    triviaState.state.suddenDeathPlayers = {
      U1: { id: 'U1', displayName: 'Alice' },
    };
    triviaState.state.correctAnswers = [];
    triviaState.state.wrongAnswers = [];

    triviaController.handleTriviaAnswer('U99', {
      gameId: 'game-1',
      answer: 'Paris',
      correctAnswer: 'Paris',
      difficulty: 'hard',
      question: 'What is the capital of France?',
      category: 'geography',
    });

    expect(triviaState.state.correctAnswers).toHaveLength(0);
  });
});

describe('Sudden Death - game history recording', () => {
  it('records game in history after sudden death win', async () => {
    triviaState.state.suddenDeathPlayers = {
      U1: { id: 'U1', displayName: 'Alice' },
      U2: { id: 'U2', displayName: 'Bob' },
    };
    triviaState.state.currentQuestion = { correctAnswer: 'A' };
    triviaState.state.correctAnswers = ['U1'];
    triviaState.state.wrongAnswers = [{ id: 'U2', answer: 'B' }];
    triviaState.state.suddenDeathRound = 1;
    triviaState.state.players = {
      U1: { displayName: 'Alice' },
      U2: { displayName: 'Bob' },
    };
    triviaState.state.currentPlayers = {
      U1: { score: 10, answers: [] },
      U2: { score: 10, answers: [] },
    };

    const promise = triviaController.sendSuddenDeathResult();
    await flushTimersAndMicrotasks();
    await promise;

    const history = triviaState.state.gameHistory;
    expect(history).toHaveLength(1);
    expect(history[0].suddenDeath).toBe(true);
    expect(history[0].winnerId).toBe('U1');
    expect(history[0].winnerName).toBe('Alice');
  });
});
