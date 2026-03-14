import { achievements, checkAchievements, getTotalCorrect } from '../helper/triviaAchievements';
import { ensurePlayerStats } from '../helper/triviaStats';

describe('getTotalCorrect', () => {
  it('returns 0 for empty categoryStats', () => {
    expect(getTotalCorrect({})).toBe(0);
  });

  it('sums correct across all categories', () => {
    const catStats = {
      science: { correct: 5, wrong: 2, points: 15 },
      history: { correct: 3, wrong: 1, points: 9 },
    };
    expect(getTotalCorrect(catStats)).toBe(8);
  });
});

describe('achievement check functions', () => {
  it('first_blood: unlocks at 1 win', () => {
    const def = achievements.find(a => a.id === 'first_blood');
    expect(def.check(ensurePlayerStats({ wins: 0 }))).toBe(false);
    expect(def.check(ensurePlayerStats({ wins: 1 }))).toBe(true);
  });

  it('hat_trick: unlocks at 3 wins', () => {
    const def = achievements.find(a => a.id === 'hat_trick');
    expect(def.check(ensurePlayerStats({ wins: 2 }))).toBe(false);
    expect(def.check(ensurePlayerStats({ wins: 3 }))).toBe(true);
  });

  it('sharp_shooter: unlocks at 10 correct', () => {
    const def = achievements.find(a => a.id === 'sharp_shooter');
    const player = ensurePlayerStats({
      categoryStats: { science: { correct: 10, wrong: 0, points: 10 } },
    });
    expect(def.check(player)).toBe(true);
  });

  it('specialist: unlocks at 80% accuracy with 10+ answers in a category', () => {
    const def = achievements.find(a => a.id === 'specialist');
    const notEnough = ensurePlayerStats({
      categoryStats: { science: { correct: 8, wrong: 1, points: 8 } },
    });
    expect(def.check(notEnough)).toBe(false); // only 9 answers

    const enough = ensurePlayerStats({
      categoryStats: { science: { correct: 8, wrong: 2, points: 8 } },
    });
    expect(def.check(enough)).toBe(true); // 10 answers, 80%
  });

  it('renaissance: unlocks when all categories have points', () => {
    const def = achievements.find(a => a.id === 'renaissance');
    const partial = ensurePlayerStats({
      categoryStats: { science: { correct: 1, wrong: 0, points: 1 } },
    });
    expect(def.check(partial)).toBe(false);
  });

  it('survivor: unlocks at 1 sudden death win', () => {
    const def = achievements.find(a => a.id === 'survivor');
    expect(def.check(ensurePlayerStats({ suddenDeathWins: 1 }))).toBe(true);
  });

  it('clutch_gene: unlocks at 3 sudden death wins', () => {
    const def = achievements.find(a => a.id === 'clutch_gene');
    expect(def.check(ensurePlayerStats({ suddenDeathWins: 2 }))).toBe(false);
    expect(def.check(ensurePlayerStats({ suddenDeathWins: 3 }))).toBe(true);
  });

  it('on_fire: unlocks at bestWinStreak >= 5', () => {
    const def = achievements.find(a => a.id === 'on_fire');
    const player = ensurePlayerStats({
      streaks: { currentWinStreak: 0, bestWinStreak: 5, currentAnswerStreak: 0, bestAnswerStreak: 0 },
    });
    expect(def.check(player)).toBe(true);
  });

  it('hot_streak: unlocks at bestAnswerStreak >= 5', () => {
    const def = achievements.find(a => a.id === 'hot_streak');
    const player = ensurePlayerStats({
      streaks: { currentWinStreak: 0, bestWinStreak: 0, currentAnswerStreak: 0, bestAnswerStreak: 5 },
    });
    expect(def.check(player)).toBe(true);
  });

  it('unstoppable: unlocks at bestAnswerStreak >= 10', () => {
    const def = achievements.find(a => a.id === 'unstoppable');
    const player = ensurePlayerStats({
      streaks: { currentWinStreak: 0, bestWinStreak: 0, currentAnswerStreak: 0, bestAnswerStreak: 10 },
    });
    expect(def.check(player)).toBe(true);
  });
});

describe('checkAchievements', () => {
  it('returns newly unlocked achievements', () => {
    const player = ensurePlayerStats({ wins: 1 });
    const newlyUnlocked = checkAchievements(player);
    expect(newlyUnlocked.some(a => a.id === 'first_blood')).toBe(true);
  });

  it('does not return already-unlocked achievements', () => {
    const player = ensurePlayerStats({
      wins: 1,
      achievements: [{ id: 'first_blood', unlockedAt: '2026-01-01T00:00:00.000Z' }],
    });
    const newlyUnlocked = checkAchievements(player);
    expect(newlyUnlocked.some(a => a.id === 'first_blood')).toBe(false);
  });

  it('returns multiple achievements at once', () => {
    const player = ensurePlayerStats({
      wins: 3,
      suddenDeathWins: 1,
    });
    const newlyUnlocked = checkAchievements(player);
    const ids = newlyUnlocked.map(a => a.id);
    expect(ids).toContain('first_blood');
    expect(ids).toContain('hat_trick');
    expect(ids).toContain('survivor');
  });

  it('returns empty array when no new achievements', () => {
    const player = ensurePlayerStats({});
    const newlyUnlocked = checkAchievements(player);
    expect(newlyUnlocked).toEqual([]);
  });

  it('accepts optional filter for subset of achievements', () => {
    const player = ensurePlayerStats({
      wins: 1,
      streaks: { currentWinStreak: 0, bestWinStreak: 0, currentAnswerStreak: 0, bestAnswerStreak: 5 },
    });
    const answerStreakOnly = checkAchievements(player, ['hot_streak', 'unstoppable']);
    const ids = answerStreakOnly.map(a => a.id);
    expect(ids).toContain('hot_streak');
    expect(ids).not.toContain('first_blood'); // filtered out
  });
});
