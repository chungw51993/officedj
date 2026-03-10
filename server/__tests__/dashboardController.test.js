// Mock Redis before importing anything that uses it
jest.mock('../util/redisClient', () => ({
  __esModule: true,
  default: {
    getObject: jest.fn(),
    setObject: jest.fn(),
  },
}));

import dashboardController from '../controller/dashboardController';

// Access the trivia state directly so we can seed it
import triviaState from '../state/trivia';

const mockRes = () => {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (params = {}) => ({
  params,
});

beforeEach(async () => {
  // Reset state to clean defaults before each test
  triviaState.state = triviaState.getInitialState();
});

describe('GET /api/trivia/leaderboard', () => {
  it('returns empty array when no players', async () => {
    const req = mockReq();
    const res = mockRes();
    await dashboardController.getLeaderboard(req, res);
    expect(res.json).toHaveBeenCalledWith({ players: [] });
  });

  it('returns players sorted by lifeTimeScore descending', async () => {
    triviaState.state.players = {
      U1: { displayName: 'Alice', lifeTimeScore: 50, wins: 3, suddenDeathWins: 1, gamesPlayed: 10 },
      U2: { displayName: 'Bob', lifeTimeScore: 100, wins: 7, suddenDeathWins: 0, gamesPlayed: 15 },
      U3: { displayName: 'Charlie', lifeTimeScore: 25, wins: 1, suddenDeathWins: 0, gamesPlayed: 5 },
    };

    const req = mockReq();
    const res = mockRes();
    await dashboardController.getLeaderboard(req, res);

    const { players } = res.json.mock.calls[0][0];
    expect(players).toHaveLength(3);
    expect(players[0].userId).toBe('U2');
    expect(players[0].lifeTimeScore).toBe(100);
    expect(players[1].userId).toBe('U1');
    expect(players[2].userId).toBe('U3');
  });

  it('fills defaults for players with missing fields', async () => {
    triviaState.state.players = {
      U1: { displayName: 'Alice' },
    };

    const req = mockReq();
    const res = mockRes();
    await dashboardController.getLeaderboard(req, res);

    const { players } = res.json.mock.calls[0][0];
    expect(players[0].lifeTimeScore).toBe(0);
    expect(players[0].wins).toBe(0);
    expect(players[0].gamesPlayed).toBe(0);
  });
});

describe('GET /api/trivia/players/:userId', () => {
  it('returns 404 for unknown player', async () => {
    const req = mockReq({ userId: 'UNKNOWN' });
    const res = mockRes();
    await dashboardController.getPlayer(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns player with category breakdown sorted by points', async () => {
    triviaState.state.players = {
      U1: {
        displayName: 'Alice',
        lifeTimeScore: 50,
        wins: 3,
        suddenDeathWins: 1,
        gamesPlayed: 10,
        categoryStats: {
          science: { correct: 5, wrong: 2, points: 15, gamesPlayed: 3 },
          history: { correct: 3, wrong: 1, points: 9, gamesPlayed: 2 },
          music: { correct: 10, wrong: 0, points: 30, gamesPlayed: 4 },
        },
      },
    };

    const req = mockReq({ userId: 'U1' });
    const res = mockRes();
    await dashboardController.getPlayer(req, res);

    const data = res.json.mock.calls[0][0];
    expect(data.displayName).toBe('Alice');
    expect(data.lifeTimeScore).toBe(50);
    expect(data.categoryStats).toHaveLength(3);
    // Sorted by points descending
    expect(data.categoryStats[0].category).toBe('music');
    expect(data.categoryStats[0].accuracy).toBe(100);
    expect(data.categoryStats[1].category).toBe('science');
    expect(data.categoryStats[1].accuracy).toBe(71); // 5/7 = 71%
    expect(data.categoryStats[2].category).toBe('history');
  });
});

describe('GET /api/trivia/history', () => {
  it('returns empty array when no history', async () => {
    const req = mockReq();
    const res = mockRes();
    await dashboardController.getHistory(req, res);
    expect(res.json).toHaveBeenCalledWith({ games: [] });
  });

  it('returns game history', async () => {
    triviaState.state.gameHistory = [
      { gameId: 'g1', date: '2026-03-08T12:00:00Z', winnerId: 'U1', winnerName: 'Alice', suddenDeath: false, scores: {} },
      { gameId: 'g2', date: '2026-03-07T12:00:00Z', winnerId: 'U2', winnerName: 'Bob', suddenDeath: true, scores: {} },
    ];

    const req = mockReq();
    const res = mockRes();
    await dashboardController.getHistory(req, res);

    const { games } = res.json.mock.calls[0][0];
    expect(games).toHaveLength(2);
    expect(games[0].gameId).toBe('g1');
    expect(games[1].suddenDeath).toBe(true);
  });
});
