import { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

const AdminUIConfig = () => {
  const [config, setConfig] = useState({
    theme: {
      primaryColor: '#4f46e5',
      secondaryColor: '#10b981',
      dangerColor: '#ef4444',
      warningColor: '#f59e0b'
    },
    features: {
      showLeaderboard: true,
      showEmpire: true,
      showTasks: true,
      showProfile: true,
      enablePremium: true,
      enableAds: true
    },
    content: {
      appName: 'Public Deindoctrination App',
      tagline: 'Build your empire through discipline',
      welcomeMessage: 'Welcome back!',
      dashboardTip: 'Maintain your streak to earn up to 50% bonus rewards!'
    },
    layout: {
      showFooter: true,
      showUserStats: true,
      compactMode: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/admin/ui-config');
      setConfig(response.data);
    } catch (error) {
      console.error('Failed to fetch UI config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await axios.put('/api/admin/ui-config', config);
      setMessage('Configuration saved successfully! Changes will apply on next page load.');
    } catch (error) {
      setMessage('Failed to save configuration: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      theme: { ...prev.theme, [key]: value }
    }));
  };

  const handleFeatureToggle = (key) => {
    setConfig(prev => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] }
    }));
  };

  const handleContentChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      content: { ...prev.content, [key]: value }
    }));
  };

  const handleLayoutToggle = (key) => {
    setConfig(prev => ({
      ...prev,
      layout: { ...prev.layout, [key]: !prev.layout[key] }
    }));
  };

  if (loading) {
    return <div className="loading">Loading UI configuration...</div>;
  }

  return (
    <div className="ui-config-container">
      <div className="admin-table-header">
        <div>
          <h2>UI Configuration</h2>
          <p>Control the frontend appearance and features dynamically</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      {/* Theme Configuration */}
      <div className="config-section">
        <h3>🎨 Theme Colors</h3>
        <div className="config-grid">
          <div className="config-item">
            <div className="config-label">
              <strong>Primary Color</strong>
              <small>Main brand color used throughout the app</small>
            </div>
            <div className="color-picker-wrapper">
              <div
                className="color-preview"
                style={{ backgroundColor: config.theme.primaryColor }}
              />
              <input
                type="color"
                value={config.theme.primaryColor}
                onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
              />
            </div>
          </div>

          <div className="config-item">
            <div className="config-label">
              <strong>Secondary Color</strong>
              <small>Used for success states and highlights</small>
            </div>
            <div className="color-picker-wrapper">
              <div
                className="color-preview"
                style={{ backgroundColor: config.theme.secondaryColor }}
              />
              <input
                type="color"
                value={config.theme.secondaryColor}
                onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
              />
            </div>
          </div>

          <div className="config-item">
            <div className="config-label">
              <strong>Danger Color</strong>
              <small>Used for errors and destructive actions</small>
            </div>
            <div className="color-picker-wrapper">
              <div
                className="color-preview"
                style={{ backgroundColor: config.theme.dangerColor }}
              />
              <input
                type="color"
                value={config.theme.dangerColor}
                onChange={(e) => handleThemeChange('dangerColor', e.target.value)}
              />
            </div>
          </div>

          <div className="config-item">
            <div className="config-label">
              <strong>Warning Color</strong>
              <small>Used for warnings and alerts</small>
            </div>
            <div className="color-picker-wrapper">
              <div
                className="color-preview"
                style={{ backgroundColor: config.theme.warningColor }}
              />
              <input
                type="color"
                value={config.theme.warningColor}
                onChange={(e) => handleThemeChange('warningColor', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="config-section">
        <h3>⚙️ Feature Toggles</h3>
        <div className="config-grid">
          <div className="config-item">
            <div className="config-label">
              <strong>Show Leaderboard</strong>
              <small>Enable/disable the leaderboard feature</small>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={config.features.showLeaderboard}
                onChange={() => handleFeatureToggle('showLeaderboard')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="config-item">
            <div className="config-label">
              <strong>Show Empire</strong>
              <small>Enable/disable the empire building feature</small>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={config.features.showEmpire}
                onChange={() => handleFeatureToggle('showEmpire')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="config-item">
            <div className="config-label">
              <strong>Show Tasks</strong>
              <small>Enable/disable the tasks feature</small>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={config.features.showTasks}
                onChange={() => handleFeatureToggle('showTasks')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="config-item">
            <div className="config-label">
              <strong>Enable Premium</strong>
              <small>Enable/disable premium subscriptions</small>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={config.features.enablePremium}
                onChange={() => handleFeatureToggle('enablePremium')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="config-item">
            <div className="config-label">
              <strong>Enable Ads</strong>
              <small>Show ads to free users</small>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={config.features.enableAds}
                onChange={() => handleFeatureToggle('enableAds')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Content Configuration */}
      <div className="config-section">
        <h3>📝 Content & Copy</h3>
        <div className="config-grid">
          <div className="form-group">
            <label><strong>App Name</strong></label>
            <input
              type="text"
              className="input"
              value={config.content.appName}
              onChange={(e) => handleContentChange('appName', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label><strong>Tagline</strong></label>
            <input
              type="text"
              className="input"
              value={config.content.tagline}
              onChange={(e) => handleContentChange('tagline', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label><strong>Welcome Message</strong></label>
            <input
              type="text"
              className="input"
              value={config.content.welcomeMessage}
              onChange={(e) => handleContentChange('welcomeMessage', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label><strong>Dashboard Tip</strong></label>
            <textarea
              className="input"
              rows="3"
              value={config.content.dashboardTip}
              onChange={(e) => handleContentChange('dashboardTip', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Layout Configuration */}
      <div className="config-section">
        <h3>📐 Layout Options</h3>
        <div className="config-grid">
          <div className="config-item">
            <div className="config-label">
              <strong>Show Footer</strong>
              <small>Display footer on all pages</small>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={config.layout.showFooter}
                onChange={() => handleLayoutToggle('showFooter')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="config-item">
            <div className="config-label">
              <strong>Show User Stats in Navbar</strong>
              <small>Display XP, currency, and streak in navigation</small>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={config.layout.showUserStats}
                onChange={() => handleLayoutToggle('showUserStats')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="config-item">
            <div className="config-label">
              <strong>Compact Mode</strong>
              <small>Reduce spacing for denser layout</small>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={config.layout.compactMode}
                onChange={() => handleLayoutToggle('compactMode')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
};

export default AdminUIConfig;
