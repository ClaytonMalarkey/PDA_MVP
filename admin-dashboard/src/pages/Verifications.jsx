import { useState, useEffect } from 'react';
import axios from 'axios';

const Verifications = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/verifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Verifications fetched:', response.data);
      setVerifications(response.data);
    } catch (error) {
      console.error('Failed to fetch verifications:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = sessionStorage.getItem('adminToken');
      await axios.post(`/api/admin/verifications/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Verification approved!');
      setShowModal(false);
      fetchVerifications();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const token = sessionStorage.getItem('adminToken');
      await axios.post(`/api/admin/verifications/${id}/reject`, 
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Verification rejected!');
      setShowModal(false);
      fetchVerifications();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to reject');
    }
  };

  const viewSubmission = (verification) => {
    setSelectedSubmission(verification);
    setShowModal(true);
  };

  if (loading) {
    return <div className="loading">Loading verifications...</div>;
  }

  return (
    <div>
      {showModal && selectedSubmission && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ padding: '2rem' }}>
              <h2>Task Submission Review</h2>
              
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '0.5rem' }}>
                <p><strong>User:</strong> {selectedSubmission.userId?.email || 'Unknown'}</p>
                <p><strong>Task ID:</strong> {selectedSubmission.taskId}</p>
                <p><strong>AI Assisted:</strong> {selectedSubmission.submission?.aiAssisted ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Submitted:</strong> {new Date(selectedSubmission.submission?.submittedAt || selectedSubmission.createdAt).toLocaleString()}</p>
                <p><strong>Rewards:</strong> ⭐ {selectedSubmission.xpAwarded} XP, 💰 {selectedSubmission.currencyAwarded} Currency</p>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h3>Submitted Work:</h3>
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1.5rem', 
                  background: 'var(--surface-color)', 
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  maxHeight: '400px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  lineHeight: '1.6'
                }}>
                  {selectedSubmission.submission?.content || selectedSubmission.proof || 'No content provided'}
                </div>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-light)' }}>
                  Character count: {(selectedSubmission.submission?.content || selectedSubmission.proof || '').length}
                </p>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleApprove(selectedSubmission._id)}
                >
                  ✅ Approve & Award Rewards
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleReject(selectedSubmission._id)}
                >
                  ❌ Reject
                </button>
                <button
                  className="btn"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-table-header">
        <div>
          <h2>Pending Verifications</h2>
          <p>Review and approve user task submissions</p>
        </div>
        <div>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
            {verifications.length} pending
          </span>
        </div>
      </div>

      {verifications.length === 0 ? (
        <div className="empty-state">
          <p>No pending verifications</p>
        </div>
      ) : (
        <div className="admin-table">
          <div className="admin-table-content">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Task</th>
                  <th>Proof</th>
                  <th>Rewards</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {verifications.map(verification => (
                  <tr key={verification._id}>
                    <td>{verification.userId?.email || 'Unknown'}</td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>
                        <code>{verification.taskId}</code>
                        {verification.submission?.aiAssisted && (
                          <span style={{ marginLeft: '0.5rem', color: 'var(--primary-color)' }}>
                            🤖 AI
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {verification.submission?.content || verification.proof ? (
                        <button
                          className="btn btn-icon"
                          onClick={() => viewSubmission(verification)}
                          style={{ fontSize: '0.875rem' }}
                        >
                          📄 View Work
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-light)' }}>No content</span>
                      )}
                    </td>
                    <td>
                      ⭐ {verification.xpAwarded} XP<br />
                      💰 {verification.currencyAwarded}
                    </td>
                    <td>{new Date(verification.createdAt).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-icon btn-secondary"
                          onClick={() => viewSubmission(verification)}
                        >
                          Review
                        </button>
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

export default Verifications;

