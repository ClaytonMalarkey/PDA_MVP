import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './User.css';

const RealWorldEmpire = () => {
  const { user } = useAuth();
  const [realRewards, setRealRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealWorldData();
  }, []);

  const fetchRealWorldData = async () => {
    try {
      const response = await axios.get('/api/tasks');
      const tasks = Array.isArray(response.data) ? response.data : [];
      const tasksWithRewards = tasks.filter(t => t.realReward && t.realReward.trim() !== '');
      setRealRewards(tasksWithRewards);
    } catch (error) {
      console.error('Failed to fetch real world data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading real world empire...</div>;
  }

  // Group rewards by category
  const grouped = realRewards.reduce((acc, task) => {
    const cat = task.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(task);
    return acc;
  }, {});

  return (
    <div className="empire-container">
      <div className="empire-header">
        <h1>🌍 Real World Empire</h1>
        <p>Complete tasks to earn real-world rewards and build your legacy</p>
      </div>

      <div className="empire-stats">
        <div className="empire-stat">
          <span className="stat-label">Available Rewards</span>
          <span className="stat-value">{realRewards.length}</span>
        </div>
        <div className="empire-stat">
          <span className="stat-label">Categories</span>
          <span className="stat-value">{Object.keys(grouped).length}</span>
        </div>
        <div className="empire-stat">
          <span className="stat-label">Your XP</span>
          <span className="stat-value">{user?.xp || 0} ⭐</span>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'white',
          borderRadius: '0.75rem',
          color: '#6b7280'
        }}>
          <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No real-world rewards available yet</p>
          <p style={{ fontSize: '0.875rem' }}>Complete tasks to unlock real-world rewards</p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, tasks]) => (
          <div key={category} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#1f2937' }}>
              {category}
            </h2>
            <div className="structures-grid">
              {tasks.map(task => (
                <div key={task._id || task.taskId} className="structure-card">
                  <div className="structure-header">
                    <h3>{task.title}</h3>
                  </div>
                  <p className="structure-effect">{task.description}</p>
                  <div className="structure-stats">
                    <div className="structure-stat">
                      <span>XP Reward:</span>
                      <span>⭐ {task.xpReward}</span>
                    </div>
                    <div className="structure-stat">
                      <span>Coins:</span>
                      <span>💰 {task.currencyReward}</span>
                    </div>
                  </div>
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    background: '#f0fdf4',
                    borderRadius: '0.5rem',
                    border: '1px solid #bbf7d0',
                    textAlign: 'center'
                  }}>
                    <span style={{ fontWeight: '600', color: '#16a34a' }}>
                      🎁 {task.realReward}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default RealWorldEmpire;
