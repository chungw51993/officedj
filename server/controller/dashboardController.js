import triviaState from '../state/trivia';

const dashboardController = {
  getLeaderboard: async (req, res) => {
    try {
      const players = triviaState.get('players');
      const playerList = Object.entries(players)
        .map(([userId, player]) => ({
          userId,
          displayName: player.displayName || userId,
          lifeTimeScore: player.lifeTimeScore || 0,
          wins: player.wins || 0,
          suddenDeathWins: player.suddenDeathWins || 0,
          gamesPlayed: player.gamesPlayed || 0,
        }))
        .sort((a, b) => b.lifeTimeScore - a.lifeTimeScore);

      res.json({ players: playerList });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  },

  getPlayer: async (req, res) => {
    try {
      const { userId } = req.params;
      const players = triviaState.get('players');
      const player = players[userId];

      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      const categoryStats = player.categoryStats || {};
      const categoryList = Object.entries(categoryStats)
        .map(([category, stats]) => ({
          category,
          correct: stats.correct || 0,
          wrong: stats.wrong || 0,
          points: stats.points || 0,
          gamesPlayed: stats.gamesPlayed || 0,
          accuracy: (stats.correct || 0) + (stats.wrong || 0) > 0
            ? Math.round(((stats.correct || 0) / ((stats.correct || 0) + (stats.wrong || 0))) * 100)
            : 0,
        }))
        .sort((a, b) => b.points - a.points);

      res.json({
        userId,
        displayName: player.displayName || userId,
        lifeTimeScore: player.lifeTimeScore || 0,
        wins: player.wins || 0,
        suddenDeathWins: player.suddenDeathWins || 0,
        gamesPlayed: player.gamesPlayed || 0,
        categoryStats: categoryList,
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch player' });
    }
  },

  getHistory: async (req, res) => {
    try {
      const gameHistory = triviaState.get('gameHistory');
      res.json({ games: gameHistory || [] });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  },
};

export default dashboardController;
