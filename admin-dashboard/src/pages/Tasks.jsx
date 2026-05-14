import { useState, useEffect } from 'react';
import axios from 'axios';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    taskId: '', title: '', description: '', category: '',
    xpReward: 10, currencyReward: 5, realReward: '', cooldown: 3600000, requiresVerification: false, taskCheck: ''
  });

  const fetchTasks = async () => {
    setLoading(true);
    try { const r = await axios.get('/api/admin/tasks'); setTasks(r.data || []); }
    catch (e) { console.error('Failed:', e); }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const r = await axios.get('/api/categories');
      setCategories(r.data || []);
      if (r.data?.length && !formData.category) setFormData(p => ({ ...p, category: r.data[0].name }));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchTasks(); fetchCategories(); }, []);

  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const validateTaskForm = () => {
    const e = {};
    if (!editingTask && (!formData.taskId || formData.taskId.trim().length < 1)) e.taskId = 'Task ID is required';
    if (!formData.title || formData.title.trim().length < 3) e.title = 'Title must be at least 3 characters';
    if (!formData.description || formData.description.trim().length < 5) e.description = 'Description must be at least 5 characters';
    if (!formData.category) e.category = 'Category is required';
    if (!formData.xpReward || formData.xpReward < 1) e.xpReward = 'XP must be at least 1';
    if (formData.currencyReward < 0) e.currencyReward = 'Cannot be negative';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateTaskForm();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitError('');
    try {
      if (editingTask) await axios.put('/api/admin/tasks/' + editingTask._id, formData);
      else await axios.post('/api/admin/tasks', formData);
      resetForm(); fetchTasks();
    } catch (e) { setSubmitError(e.response?.data?.error || 'Failed to save task'); }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({ taskId: task.taskId, title: task.title, description: task.description || '', category: task.category,
      xpReward: task.xpReward, currencyReward: task.currencyReward, realReward: task.realReward || '',
      cooldown: task.cooldown || 3600000, requiresVerification: task.requiresVerification || false, taskCheck: task.taskCheck || '' });
    setIsCreating(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try { await axios.delete('/api/admin/tasks/' + id); fetchTasks(); } catch (e) { alert('Failed'); }
  };

  const resetForm = () => {
    setIsCreating(false); setEditingTask(null); setFormErrors({}); setSubmitError('');
    setFormData({ taskId: '', title: '', description: '', category: categories[0]?.name || '',
      xpReward: 10, currencyReward: 5, realReward: '', cooldown: 3600000, requiresVerification: false, taskCheck: '' });
  };

  const filtered = tasks.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (t.taskId || '').toLowerCase().includes(q) || (t.title || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="admin-table-header">
        <div>
          <h2>✅ Manage Tasks ({tasks.length})</h2>
          <p>Create and manage tasks for users</p>
        </div>
        <button className="btn btn-primary" onClick={() => isCreating ? resetForm() : setIsCreating(true)}>
          {isCreating ? '✕ Cancel' : '+ Create Task'}
        </button>
      </div>

      {isCreating && (
        <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1rem' }}>{editingTask ? '✏️ Edit Task' : '➕ New Task'}</h3>
          {submitError && <div style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',padding:'0.5rem 0.75rem',borderRadius:'0.3rem',marginBottom:'0.75rem',fontSize:'0.85rem'}}>⚠️ {submitError}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: formErrors.taskId ? '#ef4444' : '' }}>Task ID *</label>
                <input className="input" value={formData.taskId} onChange={function(e) { setFormData({ ...formData, taskId: e.target.value }); setFormErrors({...formErrors, taskId: null}); }}
                  required disabled={!!editingTask} style={{ width: '100%', borderColor: formErrors.taskId ? '#ef4444' : '' }} />
                {formErrors.taskId && <div style={{color:'#ef4444',fontSize:'0.72rem',marginTop:'0.15rem'}}>{formErrors.taskId}</div>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: formErrors.category ? '#ef4444' : '' }}>Category *</label>
                <select className="input" value={formData.category} onChange={function(e) { setFormData({ ...formData, category: e.target.value }); setFormErrors({...formErrors, category: null}); }}
                  required style={{ width: '100%', borderColor: formErrors.category ? '#ef4444' : '' }}>
                  {categories.map(function(c) { return <option key={c.name} value={c.name}>{c.icon + ' ' + c.name}</option>; })}
                </select>
                {formErrors.category && <div style={{color:'#ef4444',fontSize:'0.72rem',marginTop:'0.15rem'}}>{formErrors.category}</div>}
              </div>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: formErrors.title ? '#ef4444' : '' }}>Title *</label>
              <input className="input" value={formData.title} onChange={function(e) { setFormData({ ...formData, title: e.target.value }); setFormErrors({...formErrors, title: null}); }}
                required style={{ width: '100%', borderColor: formErrors.title ? '#ef4444' : '' }} />
              {formErrors.title && <div style={{color:'#ef4444',fontSize:'0.72rem',marginTop:'0.15rem'}}>{formErrors.title}</div>}
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: formErrors.description ? '#ef4444' : '' }}>Description *</label>
              <textarea className="input" rows="2" value={formData.description} onChange={function(e) { setFormData({ ...formData, description: e.target.value }); setFormErrors({...formErrors, description: null}); }}
                required style={{ width: '100%', resize: 'vertical', borderColor: formErrors.description ? '#ef4444' : '' }} />
              {formErrors.description && <div style={{color:'#ef4444',fontSize:'0.72rem',marginTop:'0.15rem'}}>{formErrors.description}</div>}
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Verification Instructions</label>
              <textarea className="input" rows="3" value={formData.taskCheck} onChange={function(e) { setFormData({ ...formData, taskCheck: e.target.value }); }}
                placeholder="Optional: Instructions for verifying task completion (e.g., 'Write a short reflection on your experience')" style={{ width: '100%', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>XP Reward</label>
                <input className="input" type="number" value={formData.xpReward}
                  onChange={e => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 0 })} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Currency</label>
                <input className="input" type="number" value={formData.currencyReward}
                  onChange={e => setFormData({ ...formData, currencyReward: parseInt(e.target.value) || 0 })} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Cooldown (hrs)</label>
                <input className="input" type="number" value={Math.round(formData.cooldown / 3600000)}
                  onChange={e => setFormData({ ...formData, cooldown: (parseInt(e.target.value) || 1) * 3600000 })} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Real Reward</label>
                <input className="input" value={formData.realReward}
                  onChange={e => setFormData({ ...formData, realReward: e.target.value })} placeholder="Optional" style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input type="checkbox" checked={formData.requiresVerification}
                  onChange={e => setFormData({ ...formData, requiresVerification: e.target.checked })} /> Requires Verification
              </label>
              <div style={{ flex: 1 }} />
              <button type="submit" className="btn btn-primary">{editingTask ? '💾 Update' : '✅ Create'}</button>
              <button type="button" className="btn" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <input className="input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="🔍 Search tasks..." style={{ width: '100%', padding: '0.6rem 1rem' }} />
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '2rem' }}>Loading tasks...</div> :
      filtered.length === 0 ? <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No tasks found</div> : (
        <div className="admin-table">
          <div className="admin-table-content">
            <table>
              <thead><tr><th>ID</th><th>Title</th><th>Category</th><th>Rewards</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(task => (
                  <tr key={task._id}>
                    <td><code style={{ fontSize: '0.8rem' }}>{task.taskId}</code></td>
                    <td>
                      <strong>{task.title}</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.description}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: task.taskCheck ? 'normal' : 'italic' }}>
                        {task.taskCheck ? `✓ ${task.taskCheck}` : 'No verification instructions'}
                      </div>
                    </td>
                    <td>{task.category}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>⭐{task.xpReward} 💰{task.currencyReward}</td>
                    <td style={{ color: task.isActive !== false ? 'var(--secondary-color)' : 'var(--text-light)' }}>
                      {task.isActive !== false ? '● Active' : '○ Off'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button className="btn btn-sm" onClick={() => handleEdit(task)}>✏️</button>
                        <button className="btn btn-icon btn-danger" onClick={() => handleDelete(task._id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;

