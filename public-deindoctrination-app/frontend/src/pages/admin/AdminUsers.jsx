import { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`/api/admin/users/${userId}/role`, { role: newRole });
      alert('User role updated successfully!');
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update role');
    }
  };

  const handleBanUser = async (userId) => {
    if (!window.confirm('Are you sure you want to ban this user?')) return;
    
    try {
      await axios.post(`/api/admin/users/${userId}/ban`);
      alert('User banned successfully!');
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to ban user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div>
      <div className="admin-table-header">
        <div>
          <h2>Manage Users</h2>
          <p>View and manage all registered users</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            className="input"
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '250px' }}
          />
          <select
            className="input"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      <div className="admin-table">
        <div className="admin-table-content">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Rank</th>
                <th>XP</th>
                <th>Currency</th>
                <th>Streak</th>
                <th>Premium</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>{user.email}</td>
                  <td>
                    <select
                      className="input"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{user.rank}</td>
                  <td>{user.xp.toLocaleString()}</td>
                  <td>💰 {user.currency.toLocaleString()}</td>
                  <td>🔥 {user.streak}</td>
                  <td>
                    <span style={{ color: user.isPremium ? 'var(--warning-color)' : 'var(--text-light)' }}>
                      {user.isPremium ? '⭐ Yes' : 'No'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-icon btn-danger"
                      onClick={() => handleBanUser(user._id)}
                    >
                      Ban
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="empty-state">
          <p>No users found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
