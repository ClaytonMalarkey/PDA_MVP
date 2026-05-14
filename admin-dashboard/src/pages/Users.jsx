import { useState, useEffect } from 'react';
import axios from 'axios';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const load = async () => {
    try {
      const r = await axios.get('/api/admin/users');
      setUsers(r.data || []);
    } catch (e) { console.error('Failed to load users:', e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const saveEdit = async () => {
    try {
      await axios.put('/api/admin/users/' + editing, form);
      setEditing(null); load();
    } catch (e) { alert('Failed to save'); }
  };

  const changeRole = async (id, role) => {
    try { await axios.put('/api/admin/users/' + id + '/role', { role }); load(); }
    catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const banUser = async (id) => {
    if (!window.confirm('Ban this user?')) return;
    try { await axios.post('/api/admin/users/' + id + '/ban'); load(); }
    catch (e) { alert('Failed'); }
  };

  const delUser = async (id) => {
    if (!window.confirm('Permanently delete this user?')) return;
    try { await axios.delete('/api/admin/users/' + id); load(); }
    catch (e) { alert('Failed'); }
  };

  const filtered = users.filter(u => {
    const matchSearch = (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div>
      <div className="admin-table-header">
        <div>
          <h2>👥 Manage Users ({users.length})</h2>
          <p>View, edit, and manage all registered users</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input className="input" placeholder="Search email..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          <select className="input" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {editing && (
        <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>✏️ Edit: {form.email}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
            {[['xp','XP'],['rank','Rank'],['currency','Currency'],['energy','Energy'],['maxEnergy','Max Energy'],
              ['streak','Streak'],['influencePoints','Influence'],['innovationTokens','Innovation'],
              ['legacyStones','Legacy Stones'],['knowledgePoints','Knowledge'],['hubLevel','Hub Level']
            ].map(([key, label]) => (
              <div key={key}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block', marginBottom: '0.2rem' }}>{label}</label>
                <input className="input" type="number" value={form[key] != null ? form[key] : 0}
                  onChange={e => setForm({ ...form, [key]: Number(e.target.value) })} style={{ width: '100%' }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block', marginBottom: '0.2rem' }}>Premium</label>
              <select className="input" value={form.isPremium ? 'yes' : 'no'}
                onChange={e => setForm({ ...form, isPremium: e.target.value === 'yes' })} style={{ width: '100%' }}>
                <option value="no">No</option><option value="yes">Yes</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            <button onClick={saveEdit} className="btn btn-primary">💾 Save</button>
            <button onClick={() => setEditing(null)} className="btn">Cancel</button>
          </div>
        </div>
      )}

      <div className="admin-table">
        <div className="admin-table-content">
          <table>
            <thead>
              <tr>
                <th>Email</th><th>Role</th><th>Rank</th><th>XP</th><th>Currency</th>
                <th>Streak</th><th>Premium</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id}>
                  <td>{u.email}</td>
                  <td>
                    <select className="input" value={u.role || 'user'}
                      onChange={e => changeRole(u._id, e.target.value)}
                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem' }}>
                      <option value="user">User</option><option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{u.rank || 1}</td>
                  <td>{(u.xp || 0).toLocaleString()}</td>
                  <td>💰 {(u.currency || 0).toLocaleString()}</td>
                  <td>🔥 {u.streak || 0}</td>
                  <td style={{ color: u.isPremium ? '#f59e0b' : 'inherit' }}>{u.isPremium ? '⭐ Yes' : 'No'}</td>
                  <td style={{ fontSize: '0.8rem' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button onClick={() => { setEditing(u._id); setForm(u); }} className="btn btn-sm">✏️</button>
                      <button onClick={() => banUser(u._id)} className="btn btn-icon btn-danger">🚫</button>
                      <button onClick={() => delUser(u._id)} className="btn btn-icon btn-danger">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {filtered.length === 0 && <div className="empty-state"><p>No users found</p></div>}
    </div>
  );
};

export default Users;

