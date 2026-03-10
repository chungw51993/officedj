import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import DashboardNav from './DashboardNav';

const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await axios.get('/api/trivia/leaderboard');
        setPlayers(data.players);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getMedal = (index) => {
    if (index === 0) return '1st';
    if (index === 1) return '2nd';
    if (index === 2) return '3rd';
    return `${index + 1}th`;
  };

  const getWinRate = (player) => {
    if (!player.gamesPlayed) return '0%';
    return `${Math.round((player.wins / player.gamesPlayed) * 100)}%`;
  };

  if (loading) return <div className="trivia-dashboard"><DashboardNav /><p className="trivia-loading">Loading...</p></div>;

  return (
    <div className="trivia-dashboard">
      <DashboardNav />
      <h1 className="trivia-title">Trivia Leaderboard</h1>
      {players.length === 0 ? (
        <p className="trivia-empty">No players yet. Start a trivia game in Slack!</p>
      ) : (
        <table className="trivia-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Score</th>
              <th>Wins</th>
              <th>Games</th>
              <th>Win Rate</th>
              <th>SD Wins</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, i) => (
              <tr key={player.userId} className={i < 3 ? `trivia-top-${i + 1}` : ''}>
                <td>{getMedal(i)}</td>
                <td>
                  <Link to={`/trivia/players/${player.userId}`} className="trivia-player-link">
                    {player.displayName}
                  </Link>
                </td>
                <td>{player.lifeTimeScore}</td>
                <td>{player.wins}</td>
                <td>{player.gamesPlayed}</td>
                <td>{getWinRate(player)}</td>
                <td>{player.suddenDeathWins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Leaderboard;
