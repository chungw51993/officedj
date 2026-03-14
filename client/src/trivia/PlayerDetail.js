import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import DashboardNav from './DashboardNav';

const PlayerDetail = () => {
  const { userId } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const { data } = await axios.get(`/api/trivia/players/${userId}`);
        setPlayer(data);
      } catch (err) {
        setError(err.response?.status === 404 ? 'Player not found' : 'Failed to load player');
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [userId]);

  if (loading) return <div className="trivia-dashboard"><DashboardNav /><p className="trivia-loading">Loading...</p></div>;
  if (error) return <div className="trivia-dashboard"><DashboardNav /><p className="trivia-error">{error}</p></div>;

  return (
    <div className="trivia-dashboard">
      <DashboardNav />
      <Link to="/trivia" className="trivia-back-link">Back to Leaderboard</Link>
      <h1 className="trivia-title">{player.displayName}</h1>

      <div className="trivia-stats-grid">
        <div className="trivia-stat-card">
          <div className="trivia-stat-value">{player.lifeTimeScore}</div>
          <div className="trivia-stat-label">Lifetime Score</div>
        </div>
        <div className="trivia-stat-card">
          <div className="trivia-stat-value">{player.wins}</div>
          <div className="trivia-stat-label">Wins</div>
        </div>
        <div className="trivia-stat-card">
          <div className="trivia-stat-value">{player.gamesPlayed}</div>
          <div className="trivia-stat-label">Games Played</div>
        </div>
        <div className="trivia-stat-card">
          <div className="trivia-stat-value">{player.suddenDeathWins}</div>
          <div className="trivia-stat-label">Sudden Death Wins</div>
        </div>
        <div className="trivia-stat-card">
          <div className="trivia-stat-value">{player.streaks?.currentWinStreak || 0}</div>
          <div className="trivia-stat-label">Win Streak (Best: {player.streaks?.bestWinStreak || 0})</div>
        </div>
        <div className="trivia-stat-card">
          <div className="trivia-stat-value">{player.streaks?.currentAnswerStreak || 0}</div>
          <div className="trivia-stat-label">Answer Streak (Best: {player.streaks?.bestAnswerStreak || 0})</div>
        </div>
      </div>

      <h2 className="trivia-subtitle">Category Breakdown</h2>
      {player.categoryStats.length === 0 ? (
        <p className="trivia-empty">No category stats yet.</p>
      ) : (
        <table className="trivia-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Correct</th>
              <th>Wrong</th>
              <th>Accuracy</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {player.categoryStats.map((cat) => (
              <tr key={cat.category}>
                <td>{cat.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
                <td>{cat.correct}</td>
                <td>{cat.wrong}</td>
                <td>{cat.accuracy}%</td>
                <td>{cat.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {player.achievements && player.achievements.length > 0 && (
        <>
          <h2 className="trivia-subtitle">Achievements</h2>
          <div className="trivia-achievements-list">
            {player.achievements.map((a) => (
              <div key={a.id} className="trivia-achievement-badge">
                <span className="trivia-achievement-name">
                  {a.id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
                <span className="trivia-achievement-date">
                  {new Date(a.unlockedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PlayerDetail;
