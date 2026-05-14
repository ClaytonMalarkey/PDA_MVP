import { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await axios.get('/api/admin/metrics');
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

  return (
    <div className="admin-dashboard">
      <h2>System Overview</h2>

      <div className="admin-metrics-grid">
        <div className="admin-metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <h3>Total Users</h3>
            <p className="metric-value">{metrics?.totalUsers || 0}</p>
            <small className="metric-change positive">+{metrics?.newUsersToday || 0} today</small>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <h3>Tasks Completed</h3>
            <p className="metric-value">{metrics?.totalTaskCompletions || 0}</p>
            <small className="metric-change">{metrics?.completionsToday || 0} today</small>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="metric-icon">🔥</div>
          <div className="metric-content">
            <h3>Active Users (7d)</h3>
            <p className="metric-value">{metrics?.activeUsers || 0}</p>
            <small className="metric-change">
              {metrics?.activeUsersPercentage || 0}% of total
            </small>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="metric-icon">⭐</div>
          <div className="metric-content">
            <h3>Premium Users</h3>
            <p className="metric-value">{metrics?.premiumUsers || 0}</p>
            <small className="metric-change positive">
              {metrics?.premiumConversion || 0}% conversion
            </small>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>Revenue (Month)</h3>
            <p className="metric-value">${metrics?.monthlyRevenue || 0}</p>
            <small className="metric-change positive">
              +{metrics?.revenueGrowth || 0}% vs last month
            </small>
          </div>
        </div>

        <div className="admin-metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h3>Avg. Streak</h3>
            <p className="metric-value">{metrics?.averageStreak || 0} days</p>
            <small className="metric-change">Across all users</small>
          </div>
        </div>
      </div>

      <div className="admin-sections-grid">
        <div className="admin-section">
          <h3>Recent Activity</h3>
          <div className="activity-feed">
            {metrics?.recentActivity?.map((activity, index) => (
              <div key={index} className="activity-item">
                <span className="activity-time">{activity.time}</span>
                <span className="activity-text">{activity.text}</span>
              </div>
            )) || <p className="empty-state">No recent activity</p>}
          </div>
        </div>

        <div className="admin-section">
          <h3>System Health</h3>
          <div className="health-indicators">
            <div className="health-item">
              <span className="health-label">Database</span>
              <span className="health-status healthy">● Healthy</span>
            </div>
            <div className="health-item">
              <span className="health-label">API Response Time</span>
              <span className="health-status healthy">● {metrics?.apiResponseTime || 0}ms</span>
            </div>
            <div className="health-item">
              <span className="health-label">Server Uptime</span>
              <span className="health-status healthy">● {metrics?.uptime || '0h'}</span>
            </div>
            <div className="health-item">
              <span className="health-label">Error Rate</span>
              <span className="health-status healthy">● {metrics?.errorRate || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-quick-actions">
        <h3>Quick Actions</h3>
        <div className="quick-actions-grid">
          <a href="/admin/tasks" className="admin-action-btn">
            <span>✅</span>
            <span>Manage Tasks</span>
          </a>
          <a href="/admin/users" className="admin-action-btn">
            <span>👥</span>
            <span>Manage Users</span>
          </a>
          <a href="/admin/ui-config" className="admin-action-btn">
            <span>🎨</span>
            <span>UI Configuration</span>
          </a>
          <a href="/admin/metrics" className="admin-action-btn">
            <span>📈</span>
            <span>Detailed Metrics</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
