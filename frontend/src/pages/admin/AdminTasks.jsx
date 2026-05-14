import { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

const CATEGORIES = [
  'Physical Health',
  'Mental Discipline',
  'Skill Development',
  'Community Action',
  'Economic Action'
];

const AdminTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    xpReward: 10,
    currencyReward: 5,
    cooldown: 86400000, // 24 hours in ms
    requiresVerification: false
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/admin/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await axios.put(`/api/admin/tasks/${editingTask._id}`, formData);
        alert('Task updated successfully!');
      } else {
        await axios.post('/api/admin/tasks', formData);
        alert('Task created successfully!');
      }
      resetForm();
      fetchTasks();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save task');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      category: task.category,
      xpReward: task.xpReward,
      currencyReward: task.currencyReward,
      cooldown: task.cooldown,
      requiresVerification: task.requiresVerification
    });
    setIsCreating(true);
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await axios.delete(`/api/admin/tasks/${taskId}`);
      alert('Task deleted successfully!');
      fetchTasks();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete task');
    }
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      category: CATEGORIES[0],
      xpReward: 10,
      currencyReward: 5,
      cooldown: 86400000,
      requiresVerification: false
    });
  };

  const formatCooldown = (ms) => {
    const hours = ms / (1000 * 60 * 60);
    if (hours < 24) return `${hours}h`;
    return `${hours / 24}d`;
  };

  return (
    <div>
      <div className="admin-table-header">
        <div>
          <h2>Manage Tasks</h2>
          <p>Create and edit tasks for users to complete</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? 'Cancel' : '+ Create Task'}
        </button>
      </div>

      {isCreating && (
        <div className="admin-form">
          <h3>{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  className="input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                className="input"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>XP Reward *</label>
                <input
                  type="number"
                  className="input"
                  value={formData.xpReward}
                  onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) })}
                  required
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Currency Reward *</label>
                <input
                  type="number"
                  className="input"
                  value={formData.currencyReward}
                  onChange={(e) => setFormData({ ...formData, currencyReward: parseInt(e.target.value) })}
                  required
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Cooldown (hours) *</label>
                <input
                  type="number"
                  className="input"
                  value={formData.cooldown / (1000 * 60 * 60)}
                  onChange={(e) => setFormData({ ...formData, cooldown: parseInt(e.target.value) * 1000 * 60 * 60 })}
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.requiresVerification}
                  onChange={(e) => setFormData({ ...formData, requiresVerification: e.target.checked })}
                />
                {' '}Requires Verification
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingTask ? 'Update Task' : 'Create Task'}
              </button>
              <button type="button" className="btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-table">
        <div className="admin-table-content">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Rewards</th>
                <th>Cooldown</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task._id}>
                  <td>
                    <strong>{task.title}</strong>
                    <br />
                    <small style={{ color: 'var(--text-light)' }}>{task.description}</small>
                  </td>
                  <td>{task.category}</td>
                  <td>
                    ⭐ {task.xpReward} XP<br />
                    💰 {task.currencyReward}
                  </td>
                  <td>{formatCooldown(task.cooldown)}</td>
                  <td>
                    <span style={{ color: task.isActive ? 'var(--secondary-color)' : 'var(--text-light)' }}>
                      {task.isActive ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn-icon btn-secondary"
                        onClick={() => handleEdit(task)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-icon btn-danger"
                        onClick={() => handleDelete(task._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTasks;
