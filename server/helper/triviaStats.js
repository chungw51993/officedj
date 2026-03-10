// Pure helper functions for trivia stats — no side effects, easy to test.

export function ensurePlayerStats(player) {
  return {
    displayName: player.displayName || null,
    lifeTimeScore: player.lifeTimeScore || 0,
    wins: player.wins || 0,
    suddenDeathWins: player.suddenDeathWins || 0,
    gamesPlayed: player.gamesPlayed || 0,
    categoryStats: player.categoryStats || {},
  };
}

export function ensureCategoryStats(categoryStats, category) {
  if (!categoryStats[category]) {
    categoryStats[category] = {
      correct: 0,
      wrong: 0,
      points: 0,
      gamesPlayed: 0,
    };
  }
  return categoryStats[category];
}

export function updateCategoryStats(players, userId, category, isCorrect, points) {
  if (!category) return;
  players[userId] = ensurePlayerStats(players[userId] || { displayName: null });
  const catStats = ensureCategoryStats(players[userId].categoryStats, category);
  if (isCorrect) {
    catStats.correct += 1;
    catStats.points += points;
  } else {
    catStats.wrong += 1;
  }
}

export function buildGameRecord(gameId, currentPlayers, players, winner, wasSuddenDeath) {
  const scores = {};
  Object.keys(currentPlayers).forEach((id) => {
    const p = currentPlayers[id];
    if (p.score > 0) {
      const player = players[id] || {};
      scores[id] = {
        displayName: player.displayName || null,
        score: p.score,
      };
    }
  });
  return {
    gameId,
    date: new Date().toISOString(),
    winnerId: winner ? winner.id : null,
    winnerName: winner ? (winner.displayName || null) : null,
    suddenDeath: wasSuddenDeath,
    scores,
  };
}
