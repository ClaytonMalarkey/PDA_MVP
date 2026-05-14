import { useState, useEffect } from 'react';
import axios from 'axios';
import AITaskAssistant from '../../components/AITaskAssistant';
import './User.css';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(['All', ...response.data.map(cat => cat.name)]);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Fallback to default categories
      setCategories(['All', 'Critical Thinking', 'Media Literacy', 'Emotional Intelligence', 'Civic Engagement']);
    }
  };

  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter(task => task.category === selectedCategory));
    }
  }, [selectedCategory, tasks]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/tasks');
      setTasks(response.data);
      setFilteredTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    setCompletingTask(taskId);
    try {
      const response = await axios.post(`/api/tasks/${taskId}/complete`);
      alert(`Task completed! +${response.data.rewards.xp} XP, +${response.data.rewards.currency} Currency`);
      fetchTasks(); // Refresh tasks to update cooldowns
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to complete task');
    } finally {
      setCompletingTask(null);
    }
  };

  const canCompleteTask = (task) => {
    if (!task.lastCompleted) return true;
    const timeSinceCompletion = Date.now() - new Date(task.lastCompleted).getTime();
    return timeSinceCompletion >= task.cooldown;
  };

  const getCooldownRemaining = (task) => {
    if (!task.lastCompleted) return null;
    const timeSinceCompletion = Date.now() - new Date(task.lastCompleted).getTime();
    const remaining = task.cooldown - timeSinceCompletion;
    if (remaining <= 0) return null;
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleUseAI = (task) => {
    setSelectedTask(task);
    setShowAIAssistant(true);
  };

  const handleAIComplete = () => {
    setShowAIAssistant(false);
    setSelectedTask(null);
    // Don't refresh tasks - user still needs to click Complete button
  };

  const isAIEligibleTask = (task) => {
    // Tasks that can use AI assistance
    const aiKeywords = ['draft', 'design', 'create', 'write', 'plan', 'map', 'invent'];
    const title = task.title.toLowerCase();
    return aiKeywords.some(keyword => title.includes(keyword));
  };

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  return (
    <div className="tasks-container">
      {showAIAssistant && selectedTask ? (
        <div className="ai-assistant-modal">
          <div className="modal-overlay" onClick={() => setShowAIAssistant(false)} />
          <div className="modal-content">
            <AITaskAssistant 
              task={selectedTask} 
              onComplete={handleAIComplete}
              onClose={() => setShowAIAssistant(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="tasks-header">
        <div>
          <h1>Available Tasks</h1>
          <p>Complete tasks to earn XP and currency</p>
        </div>
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category}
              className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="tasks-grid">
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => {
            const canComplete = canCompleteTask(task);
            const cooldown = getCooldownRemaining(task);

            return (
              <div key={task._id} className="task-card">
                <div className="task-info">
                  <span className="task-category">{task.category}</span>
                  <h3 className="task-title">{task.title}</h3>
                  <p className="task-description">{task.description}</p>
                  <div className="task-rewards">
                    <span className="task-reward">⭐ {task.xpReward} XP</span>
                    <span className="task-reward">💰 {task.currencyReward} Currency</span>
                  </div>
                </div>
                <div className="task-actions">
                  {canComplete ? (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {isAIEligibleTask(task) && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleUseAI(task)}
                          style={{ flex: '1', minWidth: '120px' }}
                        >
                          🤖 Get AI Help
                        </button>
                      )}
                      <button
                        className="btn btn-primary"
                        onClick={() => handleCompleteTask(task.taskId)}
                        disabled={completingTask === task.taskId}
                        style={{ flex: '1', minWidth: '120px' }}
                      >
                        {completingTask === task.taskId ? 'Completing...' : '✅ Complete'}
                      </button>
                    </div>
                  ) : (
                    <div className="task-cooldown">
                      🕐 Cooldown: {cooldown}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <p>No tasks available in this category</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
