import { useState, useEffect } from 'react';
import axios from 'axios';
import './Pages.css';

const Empire = () => {
  const [empires, setEmpires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmpires();
  }, []);

  const fetchEmpires = async () => {
    try {
      const response = await axios.get('/api/admin/empires');
      console.log('Empire response:', response.data);
      setEmpires(response.data);
    } catch (err) {
      console.error('Empire fetch error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch empires';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading empires...</div>;
  if (error) return <div className="error">{error}</div>;

  // Handle empty data
  if (!empires || empires.length === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>🏛️ Empire Management</h1>
          <p>View and manage user empires</p>
        </div>
        <div className="card">
          <div className="card-body">
            <p>No empires found. Users need to build structures to appear here.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>🏛️ Empire Management</h1>
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

      <div className="card">
        <div className="card-header">
          <h2>All Empires</h2>
        </div>
        <div className="table-container">
          <table>
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
                  <td>💰 {empire.resources || 0}</td>
                  <td>{empire.level || 1}</td>
                  <td>{new Date(empire.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Empire;

