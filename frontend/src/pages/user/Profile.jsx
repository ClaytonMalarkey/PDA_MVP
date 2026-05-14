import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './User.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/\d/.test(newPassword)) {
      setError('Password must contain at least one number');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await axios.put('/api/user/password', { newPassword });
      setSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete('/api/user/account');
      alert('Account deleted successfully');
      logout();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete account');
    }
  };

  const getRankName = (rank) => {
    const ranks = [
      'Novice', 'Apprentice', 'Adept', 'Expert', 'Master',
      'Grandmaster', 'Legend', 'Mythic', 'Transcendent', 'Sovereign'
    ];
    return ranks[rank - 1] || 'Unknown';
  };

  return (
    <div className="profile-container">
      <div className="dashboard-header">
        <h1>Profile</h1>
        <p>Manage your account settings</p>
      </div>

      <div className="profile-grid">
        <div className="profile-section">
          <h2>Account Information</h2>
          <div className="profile-info">
            <div className="profile-field">
              <span className="profile-label">Email</span>
              <span className="profile-value">{user?.email}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Role</span>
              <span className="profile-value">{user?.role === 'admin' ? '🛡️ Admin' : '👤 User'}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Member Since</span>
              <span className="profile-value">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Game Statistics</h2>
          <div className="profile-info">
            <div className="profile-field">
              <span className="profile-label">Rank</span>
              <span className="profile-value">
                {user?.rank} - {getRankName(user?.rank)}
              </span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Total XP</span>
              <span className="profile-value">{user?.xp?.toLocaleString() || 0}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Currency</span>
              <span className="profile-value">💰 {user?.currency?.toLocaleString() || 0}</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Current Streak</span>
              <span className="profile-value">🔥 {user?.streak || 0} days</span>
            </div>
            <div className="profile-field">
              <span className="profile-label">Premium Status</span>
              <span className="profile-value">
                {user?.isPremium ? '⭐ Premium' : 'Free'}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Security</h2>
          
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {!isEditing ? (
            <button
              className="btn btn-primary"
              onClick={() => setIsEditing(true)}
            >
              Change Password
            </button>
          ) : (
            <form onSubmit={handlePasswordChange} className="auth-form">
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  className="input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Min 8 characters, 1 number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter password"
                />
              </div>

              <div className="profile-actions">
                <button type="submit" className="btn btn-primary">
                  Update Password
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setIsEditing(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="profile-section">
          <h2>Danger Zone</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            className="btn btn-danger"
            onClick={handleDeleteAccount}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
