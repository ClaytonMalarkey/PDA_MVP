import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './User.css';

const PERIODS = ['daily', 'weekly', 'all-time'];

const Leaderboard = () => {
  const { user } = useAuth();
  const [rankings, setRankings] = useState([]);
  const [userPosition, setUserPosition] = useState(null);
  const [period, setPeriod] = useState('all-time');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/leaderboard?period=${period}`);
      console.log('Leaderboard response:', response.data);
      console.log('Response type:', typeof response.data);
      console.log('Is array?:', Array.isArray(response.data));
      
      // Handle both formats: simple array (admin) or object with rankings (user)
      if (Array.isArray(response.data)) {
        console.log('Setting rankings from array, length:', response.data.length);
        console.log('First item:', response.data[0]);
        setRankings(response.data);
        setUserPosition(null);
      } else {
        console.log('Setting rankings from object');
        console.log('Rankings:', response.data.rankings);
        console.log('User position:', response.data.userPosition);
        setRankings(response.data.rankings || []);
        setUserPosition(response.data.userPosition);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading leaderboard...</div>;
  }

  return (
    <div className="leaderboard-container">
      <div className="dashboard-header">
        <h1>Leaderboard</h1>
        <p>See how you rank against other users</p>
      </div>

      <div className="leaderboard-filters">
        {PERIODS.map(p => (
          <button
            key={p}
            className={`filter-btn ${period === p ? 'active' : ''}`}
            onClick={() => setPeriod(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {userPosition && (
        <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h3>Your Position</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)', margin: '0.5rem 0' }}>
            #{userPosition}
          </p>
          <p style={{ color: 'var(--text-light)' }}>Keep climbing!</p>
        </div>
      )}

      <div className="leaderboard-table">
        <div className="leaderboard-row header">
          <div>Rank</div>
          <div>User</div>
          <div>XP</div>
          <div>Level</div>
        </div>
        {rankings && rankings.length > 0 ? rankings.map((entry, index) => (
          <div
            key={entry._id || entry.userId || index}
            className={`leaderboard-row ${entry._id === user?._id || entry.userId === user?._id ? 'current-user' : ''}`}
          >
            <div className="leaderboard-rank">#{entry.position || index + 1}</div>
            <div className="leaderboard-user">{entry.username || entry.email || 'Unknown'}</div>
            <div className="leaderboard-xp">{(entry.xp || 0).toLocaleString()} XP</div>
            <div className="leaderboard-rank-name">Rank {entry.rank || 1}</div>
          </div>
        )) : (
          <div className="empty-state">
            <p>No rankings available for this period</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
