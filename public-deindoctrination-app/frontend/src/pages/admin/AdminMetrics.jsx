import { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

const AdminMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      const response = await axios.get(`/api/admin/metrics?range=${timeRange}`);
      setMetrics(response.data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading metrics...</div>;
  }

  if (!metrics) {
    return <div className="empty-state">Failed to load metrics</div>;
  }

  return (
    <div>
      <div className="admin-table-header">
        <div>
          <h2>System Metrics</h2>
          <p>Detailed analytics and performance data</p>
        </div>
        <select
          className="input"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <h3>Total Users</h3>
            <div className="metric-value">{metrics.totalUsers?.toLocaleString() || 0}</div>
            <div className="metric-change positive">
              +{metrics.newUsers || 0} new
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <h3>Active Users</h3>
            <div className="metric-value">{metrics.activeUsers?.toLocaleString() || 0}</div>
            <div className="metric-subtitle">
              {((metrics.activeUsers / metrics.totalUsers) * 100).toFixed(1)}% of total
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <h3>Tasks Completed</h3>
            <div className="metric-value">{metrics.tasksCompleted?.toLocaleString() || 0}</div>
            <div className="metric-subtitle">
              {(metrics.tasksCompleted / metrics.activeUsers || 0).toFixed(1)} per active user
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🔥</div>
          <div className="metric-content">
            <h3>Average Streak</h3>
            <div className="metric-value">{metrics.averageStreak?.toFixed(1) || 0}</div>
            <div className="metric-subtitle">
              Max: {metrics.maxStreak || 0} days
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>Total Currency</h3>
            <div className="metric-value">{metrics.totalCurrency?.toLocaleString() || 0}</div>
            <div className="metric-subtitle">
              Avg: {(metrics.totalCurrency / metrics.totalUsers || 0).toFixed(0)} per user
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⭐</div>
          <div className="metric-content">
            <h3>Premium Users</h3>
            <div className="metric-value">{metrics.premiumUsers?.toLocaleString() || 0}</div>
            <div className="metric-subtitle">
              {((metrics.premiumUsers / metrics.totalUsers) * 100).toFixed(1)}% conversion
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🏰</div>
          <div className="metric-content">
            <h3>Structures Built</h3>
            <div className="metric-value">{metrics.structuresBuilt?.toLocaleString() || 0}</div>
            <div className="metric-subtitle">
              {(metrics.structuresBuilt / metrics.totalUsers || 0).toFixed(1)} per user
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💵</div>
          <div className="metric-content">
            <h3>Revenue</h3>
            <div className="metric-value">${metrics.revenue?.toLocaleString() || 0}</div>
            <div className="metric-subtitle">
              ${(metrics.revenue / metrics.totalUsers || 0).toFixed(2)} per user
            </div>
          </div>
        </div>
      </div>

      <div className="admin-table" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Task Completion by Category</h3>
        <div className="admin-table-content">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Total Tasks</th>
                <th>Completions</th>
                <th>Completion Rate</th>
                <th>Avg Time (min)</th>
              </tr>
            </thead>
            <tbody>
              {metrics.categoryStats?.map(stat => (
                <tr key={stat.category}>
                  <td>{stat.category}</td>
                  <td>{stat.totalTasks}</td>
                  <td>{stat.completions.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div 
                          className="progress-fill" 
                          style={{ width: `${stat.completionRate}%` }}
                        />
                      </div>
                      <span>{stat.completionRate.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td>{stat.avgTime}</td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-light)' }}>
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-table" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Top Performers</h3>
        <div className="admin-table-content">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>User</th>
                <th>XP</th>
                <th>Tasks</th>
                <th>Streak</th>
                <th>Currency</th>
              </tr>
            </thead>
            <tbody>
              {metrics.topPerformers?.map((user, index) => (
                <tr key={user._id}>
                  <td>
                    <span className="rank-badge">#{index + 1}</span>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.xp.toLocaleString()}</td>
                  <td>{user.tasksCompleted}</td>
                  <td>🔥 {user.streak}</td>
                  <td>💰 {user.currency.toLocaleString()}</td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-light)' }}>
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminMetrics;
