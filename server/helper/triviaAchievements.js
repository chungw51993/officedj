import categories from './triviaCategory';

export function getTotalCorrect(categoryStats) {
  return Object.values(categoryStats || {}).reduce(
    (sum, cat) => sum + (cat.correct || 0),
    0,
  );
}

export const achievements = [
  // Win-based
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Win your first game',
    check: (player) => player.wins >= 1,
  },
  {
    id: 'hat_trick',
    name: 'Hat Trick',
    description: 'Win 3 games',
    check: (player) => player.wins >= 3,
  },

  // Answer-based
  {
    id: 'sharp_shooter',
    name: 'Sharp Shooter',
    description: '10 correct answers',
    check: (player) => getTotalCorrect(player.categoryStats) >= 10,
  },
  {
    id: 'trivia_nerd',
    name: 'Trivia Nerd',
    description: '100 correct answers',
    check: (player) => getTotalCorrect(player.categoryStats) >= 100,
  },
  {
    id: 'walking_encyclopedia',
    name: 'Walking Encyclopedia',
    description: '500 correct answers',
    check: (player) => getTotalCorrect(player.categoryStats) >= 500,
  },

  // Category-based
  {
    id: 'specialist',
    name: 'Specialist',
    description: '80%+ accuracy in any category (min 10 questions)',
    check: (player) => {
      const catStats = player.categoryStats || {};
      return Object.values(catStats).some((stats) => {
        const total = (stats.correct || 0) + (stats.wrong || 0);
        return total >= 10 && (stats.correct || 0) / total >= 0.8;
      });
    },
  },
  {
    id: 'renaissance',
    name: 'Renaissance',
    description: 'Score in all categories',
    check: (player) => {
      const catStats = player.categoryStats || {};
      return categories.every((cat) => {
        const stats = catStats[cat.value];
        return stats && stats.points > 0;
      });
    },
  },

  // Sudden Death
  {
    id: 'survivor',
    name: 'Survivor',
    description: 'Win a sudden death',
    check: (player) => player.suddenDeathWins >= 1,
  },
  {
    id: 'clutch_gene',
    name: 'Clutch Gene',
    description: 'Win 3 sudden deaths',
    check: (player) => player.suddenDeathWins >= 3,
  },

  // Streak-based
  {
    id: 'on_fire',
    name: 'On Fire',
    description: '5-win streak',
    check: (player) => (player.streaks || {}).bestWinStreak >= 5,
  },
  {
    id: 'hot_streak',
    name: 'Hot Streak',
    description: '5 correct answers in a row',
    check: (player) => (player.streaks || {}).bestAnswerStreak >= 5,
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: '10 correct answers in a row',
    check: (player) => (player.streaks || {}).bestAnswerStreak >= 10,
  },
];

export function checkAchievements(player, filterIds) {
  const existing = new Set((player.achievements || []).map(a => a.id));
  const defs = filterIds
    ? achievements.filter(a => filterIds.includes(a.id))
    : achievements;

  return defs.filter(def => !existing.has(def.id) && def.check(player));
}
