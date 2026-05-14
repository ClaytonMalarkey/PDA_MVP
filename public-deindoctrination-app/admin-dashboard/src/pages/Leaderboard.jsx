import { useState, useEffect } from 'react';
import axios from 'axios';
import './Pages.css';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('xp');

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`/api/leaderboard?sortBy=${filter}`);
      // Handle both array response and object with rankings
      const data = Array.isArray(response.data) ? response.data : response.data.rankings || [];
      setLeaderboard(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading leaderboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>🏆 Leaderboard Management</h1>
        <p>View and analyze user rankings</p>
      </div>

      <div className="filters">
        <label>Sort By:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
          <option value="xp">XP</option>
          <option value="currency">Currency</option>
          <option value="rank">Rank</option>
        </select>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-value">{leaderboard.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total XP</h3>
          <p className="stat-value">
            {leaderboard.reduce((sum, u) => sum + (u.xp || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="stat-card">
          <h3>Total Currency</h3>
          <p className="stat-value">
            {leaderboard.reduce((sum, u) => sum + (u.currency || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Rankings</h2>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>User</th>
                <th>Email</th>
                <th>Rank</th>
                <th>XP</th>
                <th>Currency</th>
                <th>Tasks Completed</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user, index) => (
                <tr key={user._id}>
                  <td>
                    <span className={`position-badge ${index < 3 ? 'top-three' : ''}`}>
                      #{index + 1}
                    </span>
                  </td>
                  <td>{user.username || 'N/A'}</td>
                  <td>{user.email}</td>
                  <td>{user.rank || 1}</td>
                  <td>{user.xp || 0}</td>
                  <td>💰 {user.currency || 0}</td>
                  <td>{user.completedTasks || 0}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

