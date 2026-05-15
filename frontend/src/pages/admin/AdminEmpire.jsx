import { useState, useEffect } from 'react';
import './Admin.css';

const AdminEmpire = () => {
  const [empires, setEmpires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmpires();
  }, []);

  const fetchEmpires = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('196.75.153.172:5000/api/admin/empires', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch empires');

      const data = await response.json();
      setEmpires(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading empires...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2>🏛️ Empire Management</h2>
        <p>View and manage user empires</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Empires</h3>
          <p className="stat-value">{empires.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Buildings</h3>
          <p className="stat-value">
            {empires.reduce((sum, e) => sum + (e.buildings?.length || 0), 0)}
          </p>
        </div>
        <div className="stat-card">
          <h3>Total Resources</h3>
          <p className="stat-value">
            {empires.reduce((sum, e) => sum + (e.resources || 0), 0)}
          </p>
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Buildings</th>
              <th>Resources</th>
              <th>Level</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {empires.map((empire) => (
              <tr key={empire.userId}>
                <td>{empire.username || 'N/A'}</td>
                <td>{empire.email}</td>
                <td>{empire.buildings?.length || 0}</td>
                <td>{empire.resources || 0}</td>
                <td>{empire.level || 1}</td>
                <td>{new Date(empire.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminEmpire;
