import { useState, useEffect } from 'react';
import './Admin.css';

const AdminLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('xp'); // xp, currency, rank

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`196.75.153.172:5000/api/leaderboard?sortBy=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch leaderboard');

      const data = await response.json();
      setLeaderboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading leaderboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2>🏆 Leaderboard Management</h2>
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

      <div className="table-container">
        <table className="admin-table">
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
  );
};

export default AdminLeaderboard;
