import { useState, useEffect } from 'react';
import axios from 'axios';

const UIConfig = () => {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/admin/ui-config');
      setConfig(response.data);
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/api/admin/ui-config', config);
      alert('UI configuration saved successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all UI configuration to defaults?')) {
      fetchConfig();
    }
  };

  if (loading) {
    return <div className="loading">Loading configuration...</div>;
  }

  return (
    <div>
      <div className="admin-table-header">
        <div>
          <h2>UI Configuration</h2>
          <p>Customize the user interface dynamically</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn" onClick={handleReset}>
            Reset
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {/* Theme Colors */}
        <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: 'var(--shadow)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Theme Colors</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Primary Color</label>
              <input
                type="color"
                className="input"
                value={config.primaryColor || '#2563eb'}
                onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Secondary Color</label>
              <input
                type="color"
                className="input"
                value={config.secondaryColor || '#10b981'}
                onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Accent Color</label>
              <input
                type="color"
                className="input"
                value={config.accentColor || '#f59e0b'}
                onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: 'var(--shadow)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Feature Toggles</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.enableLeaderboard !== false}
                onChange={(e) => setConfig({ ...config, enableLeaderboard: e.target.checked })}
              />
              Enable Leaderboard
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.enableEmpire !== false}
                onChange={(e) => setConfig({ ...config, enableEmpire: e.target.checked })}
              />
              Enable Empire Builder
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.enablePremium !== false}
                onChange={(e) => setConfig({ ...config, enablePremium: e.target.checked })}
              />
              Enable Premium Features
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.showAds !== false}
                onChange={(e) => setConfig({ ...config, showAds: e.target.checked })}
              />
              Show Advertisements
            </label>
          </div>
        </div>

        {/* Content & Copy */}
        <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: 'var(--shadow)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Content & Copy</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>App Title</label>
              <input
                type="text"
                className="input"
                value={config.appTitle || 'Public Deindoctrination'}
                onChange={(e) => setConfig({ ...config, appTitle: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Welcome Message</label>
              <textarea
                className="input"
                rows="3"
                value={config.welcomeMessage || 'Welcome to the platform!'}
                onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Footer Text</label>
              <input
                type="text"
                className="input"
                value={config.footerText || '© 2024 Public Deindoctrination'}
                onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Layout Options */}
        <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: 'var(--shadow)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Layout Options</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Sidebar Position</label>
              <select
                className="input"
                value={config.sidebarPosition || 'left'}
                onChange={(e) => setConfig({ ...config, sidebarPosition: e.target.value })}
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Card Style</label>
              <select
                className="input"
                value={config.cardStyle || 'rounded'}
                onChange={(e) => setConfig({ ...config, cardStyle: e.target.value })}
              >
                <option value="rounded">Rounded</option>
                <option value="square">Square</option>
                <option value="sharp">Sharp</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Animation Speed</label>
              <select
                className="input"
                value={config.animationSpeed || 'normal'}
                onChange={(e) => setConfig({ ...config, animationSpeed: e.target.value })}
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIConfig;

