import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './User.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        axios.get('/api/user/stats'),
        axios.get('/api/user/recent-tasks')
      ]);
      setStats(statsRes.data);
      setRecentTasks(tasksRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.email}!</h1>
        <p>Continue building your empire through discipline</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h3>Rank</h3>
            <p className="stat-value">{user?.rank || 1}</p>
            <small>{stats?.rankName || 'Novice'}</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>Total XP</h3>
            <p className="stat-value">{user?.xp || 0}</p>
            <small>{stats?.xpToNextRank || 0} to next rank</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Currency</h3>
            <p className="stat-value">{user?.currency || 0}</p>
            <small>Spend in Empire</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <h3>Streak</h3>
            <p className="stat-value">{user?.streak || 0} days</p>
            <small>{stats?.streakMultiplier || '1.0'}x multiplier</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🧪</div>
          <div className="stat-content">
            <h3>Knowledge</h3>
            <p className="stat-value">{user?.knowledgePoints || 0}</p>
            <small>Research points</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>Influence</h3>
            <p className="stat-value">{user?.influencePoints || 0}</p>
            <small>Governance power</small>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <Link to="/space" className="action-card" style={{ borderColor: '#6366f1', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))' }}>
              <span className="action-icon">🌌</span>
              <div>
                <span className="action-title">Launch Space Empire</span>
                <span className="action-desc">Explore the 3D solar system</span>
              </div>
            </Link>
            <Link to="/tasks" className="action-card">
              <span className="action-icon">✅</span>
              <span className="action-title">Complete Tasks</span>
              <span className="action-desc">Earn XP and currency</span>
            </Link>
            <Link to="/empire" className="action-card">
              <span className="action-icon">🏛️</span>
              <span className="action-title">Build Empire</span>
              <span className="action-desc">Upgrade structures</span>
            </Link>
            <Link to="/leaderboard" className="action-card">
              <span className="action-icon">📊</span>
              <span className="action-title">Leaderboard</span>
              <span className="action-desc">See your ranking</span>
            </Link>
            <Link to="/research" className="action-card">
              <span className="action-icon">🔬</span>
              <span className="action-title">Research Tree</span>
              <span className="action-desc">1,000 nodes to unlock</span>
            </Link>
            <Link to="/civilizations" className="action-card">
              <span className="action-icon">🏛️</span>
              <span className="action-title">Civilizations</span>
              <span className="action-desc">Join or create alliances</span>
            </Link>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {recentTasks.length > 0 ? (
              recentTasks.map((task, index) => (
                <div key={index} className="activity-item">
                  <span className="activity-icon">✓</span>
                  <div className="activity-content">
                    <p className="activity-title">{task.title}</p>
                    <small className="activity-time">{task.completedAt}</small>
                  </div>
                  <span className="activity-reward">+{task.xpReward} XP</span>
                </div>
              ))
            ) : (
              <p className="empty-state">No recent activity. Start completing tasks!</p>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-tips">
        <h3>💡 Daily Tip</h3>
        <p>Maintain your streak to earn up to 50% bonus rewards! Complete at least one task every 24 hours.</p>
      </div>
    </div>
  );
};

export default Dashboard;
