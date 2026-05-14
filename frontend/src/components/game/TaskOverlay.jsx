import { useState, useEffect } from 'react';
import axios from 'axios';
import { useGame } from '../../context/GameContext';
import './Game.css';

export default function TaskOverlay({ onClose }) {
  const { addNotification, fetchGameData } = useGame();
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const [tasksRes, catsRes] = await Promise.all([
        axios.get('/api/tasks'),
        axios.get('/api/categories'),
      ]);
      const taskList = Array.isArray(tasksRes.data) ? tasksRes.data : [];
      setTasks(taskList);
      setCategories(catsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (task) => {
    setCompleting(task.taskId);
    try {
      await axios.post(`/api/tasks/${task.taskId}/complete`);
      addNotification(`✅ Completed: ${task.title} (+${task.xpReward} XP, +${task.currencyReward} 💰)`, 'success');
      fetchGameData();
      // Remove from list
      setTasks(prev => prev.filter(t => t.taskId !== task.taskId));
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to complete task';
      addNotification(`❌ ${msg}`, 'warning');
    } finally {
      setCompleting(null);
    }
  };

  const filtered = selectedCategory === 'All'
    ? tasks
    : tasks.filter(t => t.category === selectedCategory);

  return (
    <div className="task-overlay" onClick={onClose}>
      <div className="task-overlay-content" onClick={e => e.stopPropagation()}>
        <div className="task-overlay-header">
          <h2>📋 Real-World Missions</h2>
          <button className="planet-panel-close" onClick={onClose}>✕</button>
        </div>

        <div className="task-overlay-categories">
          <button
            className={`task-cat-btn ${selectedCategory === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('All')}
          >
            All ({tasks.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.name}
              className={`task-cat-btn ${selectedCategory === cat.name ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.name)}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>Loading missions...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>No missions available in this category</p>
        ) : (
          <div className="task-overlay-list">
            {filtered.slice(0, 20).map(task => (
              <div key={task.taskId} className="task-overlay-item">
                <div className="task-overlay-info">
                  <h4>{task.title}</h4>
                  <p>{task.description?.substring(0, 80)}{task.description?.length > 80 ? '...' : ''}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="task-overlay-rewards">
                    <span>⭐{task.xpReward}</span>
                    <span>💰{task.currencyReward}</span>
                  </div>
                  <button
                    className="task-complete-btn"
                    onClick={() => handleComplete(task)}
                    disabled={completing === task.taskId}
                  >
                    {completing === task.taskId ? '...' : 'Complete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
