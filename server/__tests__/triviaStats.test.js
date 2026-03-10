import {
  ensurePlayerStats,
  ensureCategoryStats,
  updateCategoryStats,
  buildGameRecord,
} from '../helper/triviaStats';

describe('ensurePlayerStats', () => {
  it('fills all defaults for empty player', () => {
    const result = ensurePlayerStats({});
    expect(result).toEqual({
      displayName: null,
      lifeTimeScore: 0,
      wins: 0,
      suddenDeathWins: 0,
      gamesPlayed: 0,
      categoryStats: {},
    });
  });

  it('preserves existing values', () => {
    const result = ensurePlayerStats({
      displayName: 'Alice',
      lifeTimeScore: 42,
      wins: 5,
      suddenDeathWins: 2,
      gamesPlayed: 10,
      categoryStats: { science: { correct: 3, wrong: 1, points: 9, gamesPlayed: 2 } },
    });
    expect(result.displayName).toBe('Alice');
    expect(result.lifeTimeScore).toBe(42);
    expect(result.wins).toBe(5);
    expect(result.suddenDeathWins).toBe(2);
    expect(result.gamesPlayed).toBe(10);
    expect(result.categoryStats.science.correct).toBe(3);
  });

  it('fills missing fields on partial player', () => {
    const result = ensurePlayerStats({ displayName: 'Bob', wins: 3 });
    expect(result.lifeTimeScore).toBe(0);
    expect(result.suddenDeathWins).toBe(0);
    expect(result.gamesPlayed).toBe(0);
    expect(result.categoryStats).toEqual({});
    expect(result.wins).toBe(3);
  });
});

describe('ensureCategoryStats', () => {
  it('creates category with zeroed stats if missing', () => {
    const categoryStats = {};
    const result = ensureCategoryStats(categoryStats, 'science');
    expect(result).toEqual({ correct: 0, wrong: 0, points: 0, gamesPlayed: 0 });
    expect(categoryStats.science).toBe(result);
  });

  it('returns existing category stats without overwriting', () => {
    const categoryStats = {
      science: { correct: 5, wrong: 2, points: 15, gamesPlayed: 3 },
    };
    const result = ensureCategoryStats(categoryStats, 'science');
    expect(result.correct).toBe(5);
    expect(result.points).toBe(15);
  });
});

describe('updateCategoryStats', () => {
  it('increments correct and points for correct answer', () => {
    const players = { U1: { displayName: 'Alice' } };
    updateCategoryStats(players, 'U1', 'history', true, 3);
    expect(players.U1.categoryStats.history.correct).toBe(1);
    expect(players.U1.categoryStats.history.points).toBe(3);
    expect(players.U1.categoryStats.history.wrong).toBe(0);
  });

  it('increments wrong for incorrect answer', () => {
    const players = { U1: { displayName: 'Alice' } };
    updateCategoryStats(players, 'U1', 'history', false, 0);
    expect(players.U1.categoryStats.history.wrong).toBe(1);
    expect(players.U1.categoryStats.history.correct).toBe(0);
    expect(players.U1.categoryStats.history.points).toBe(0);
  });

  it('accumulates across multiple answers', () => {
    const players = { U1: { displayName: 'Alice' } };
    updateCategoryStats(players, 'U1', 'science', true, 1);
    updateCategoryStats(players, 'U1', 'science', true, 2);
    updateCategoryStats(players, 'U1', 'science', false, 0);
    expect(players.U1.categoryStats.science.correct).toBe(2);
    expect(players.U1.categoryStats.science.wrong).toBe(1);
    expect(players.U1.categoryStats.science.points).toBe(3);
  });

  it('does nothing if category is null/undefined', () => {
    const players = { U1: { displayName: 'Alice' } };
    updateCategoryStats(players, 'U1', null, true, 1);
    expect(players.U1.displayName).toBe('Alice');
  });

  it('creates player entry if missing', () => {
    const players = {};
    updateCategoryStats(players, 'U99', 'music', true, 2);
    expect(players.U99).toBeDefined();
    expect(players.U99.categoryStats.music.correct).toBe(1);
    expect(players.U99.categoryStats.music.points).toBe(2);
  });
});

describe('buildGameRecord', () => {
  it('builds record with a winner', () => {
    const currentPlayers = {
      U1: { score: 10, answers: [] },
      U2: { score: 5, answers: [] },
      U3: { score: 0, answers: [] },
    };
    const players = {
      U1: { displayName: 'Alice' },
      U2: { displayName: 'Bob' },
    };
    const winner = { id: 'U1', displayName: 'Alice' };
    const record = buildGameRecord('game-1', currentPlayers, players, winner, false);

    expect(record.gameId).toBe('game-1');
    expect(record.winnerId).toBe('U1');
    expect(record.winnerName).toBe('Alice');
    expect(record.suddenDeath).toBe(false);
    expect(record.scores.U1).toEqual({ displayName: 'Alice', score: 10 });
    expect(record.scores.U2).toEqual({ displayName: 'Bob', score: 5 });
    expect(record.scores.U3).toBeUndefined(); // score 0 excluded
    expect(record.date).toBeDefined();
  });

  it('builds record with no winner (null)', () => {
    const currentPlayers = {
      U1: { score: 5, answers: [] },
      U2: { score: 5, answers: [] },
    };
    const players = {
      U1: { displayName: 'Alice' },
      U2: { displayName: 'Bob' },
    };
    const record = buildGameRecord('game-2', currentPlayers, players, null, true);

    expect(record.winnerId).toBeNull();
    expect(record.winnerName).toBeNull();
    expect(record.suddenDeath).toBe(true);
  });

  it('handles players not in the players lookup', () => {
    const currentPlayers = {
      U1: { score: 3, answers: [] },
    };
    const players = {};
    const record = buildGameRecord('game-3', currentPlayers, players, null, false);

    expect(record.scores.U1).toEqual({ displayName: null, score: 3 });
  });
});
