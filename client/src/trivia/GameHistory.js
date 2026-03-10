import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import DashboardNav from './DashboardNav';

const GameHistory = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await axios.get('/api/trivia/history');
        setGames(data.games);
      } catch (err) {
        console.error('Failed to fetch game history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  };

  if (loading) return <div className="trivia-dashboard"><DashboardNav /><p className="trivia-loading">Loading...</p></div>;

  return (
    <div className="trivia-dashboard">
      <DashboardNav />
      <h1 className="trivia-title">Game History</h1>
      {games.length === 0 ? (
        <p className="trivia-empty">No games played yet.</p>
      ) : (
        <div className="trivia-history-list">
          {games.map((game) => (
            <div key={game.gameId} className="trivia-history-card">
              <div className="trivia-history-header">
                <span className="trivia-history-date">{formatDate(game.date)}</span>
                {game.suddenDeath && <span className="trivia-badge-sd">Sudden Death</span>}
              </div>
              <div className="trivia-history-winner">
                Winner:{' '}
                <Link to={`/trivia/players/${game.winnerId}`} className="trivia-player-link">
                  {game.winnerName}
                </Link>
              </div>
              {game.scores && Object.keys(game.scores).length > 0 && (
                <div className="trivia-history-scores">
                  {Object.entries(game.scores)
                    .sort(([, a], [, b]) => (b.score || 0) - (a.score || 0))
                    .map(([id, info]) => (
                      <span key={id} className="trivia-score-chip">
                        {info.name}: {info.score || 0}
                      </span>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameHistory;
