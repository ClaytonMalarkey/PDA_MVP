import { useState, useEffect } from 'react';
import axios from 'axios';

const CATEGORY_LABELS = {
  menus: { label: '📱 Menu Visibility', desc: 'Toggle game toolbar buttons on/off' },
  game: { label: '🎮 Game Settings', desc: 'Core gameplay parameters' },
  economy: { label: '💰 Economy', desc: 'XP, currency, and reward settings' },
  features: { label: '⚡ Features', desc: 'Enable/disable major features' },
  display: { label: '🖥️ Display', desc: 'UI overlay settings' },
  background: { label: '🎨 Background', desc: 'Game background colors and effects' },
};

const GameConfig = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [saving, setSaving] = useState(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCat, setNewCat] = useState('game');
  const [newDesc, setNewDesc] = useState('');

  const token = sessionStorage.getItem('adminToken');
  const api = axios.create({ headers: { Authorization: `Bearer ${token}` } });

  const fetchConfigs = async () => {
    try {
      const res = await api.get('/api/game-config/admin');
      setConfigs(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchConfigs(); }, []);

  const updateConfig = async (config, newValue) => {
    setSaving(config.configKey);
    try {
      await api.post('/api/game-config/admin', {
        configKey: config.configKey,
        value: newValue,
        description: config.description,
        category: config.category
      });
      fetchConfigs();
    } catch (e) { alert('Failed to update'); }
    finally { setSaving(null); }
  };

  const addConfig = async () => {
    if (!newKey.trim()) return;
    try {
      let val = newValue;
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (!isNaN(val) && val.trim()) val = Number(val);
      await api.post('/api/game-config/admin', { configKey: newKey, value: val, category: newCat, description: newDesc });
      setNewKey(''); setNewValue(''); setNewDesc('');
      fetchConfigs();
    } catch (e) { alert('Failed'); }
  };

  const deleteConfig = async (key) => {
    if (!confirm('Delete ' + key + '?')) return;
    try { await api.delete('/api/game-config/admin/' + key); fetchConfigs(); } catch (e) { alert('Failed'); }
  };

  const filtered = filter === 'all' ? configs : configs.filter(c => c.category === filter);

  const renderValue = (config) => {
    const val = config.value;
    if (typeof val === 'boolean') {
      return (
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={val} onChange={() => updateConfig(config, !val)}
            style={{ width: 18, height: 18, cursor: 'pointer' }} />
          <span style={{ color: val ? 'var(--secondary-color)' : 'var(--text-light)', fontWeight: 600 }}>
            {val ? 'ON' : 'OFF'}
          </span>
        </label>
      );
    }
    if (typeof val === 'number') {
      return (
        <input type="number" defaultValue={val} style={{ width: 100, padding: '0.3rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem' }}
          onBlur={(e) => { const n = Number(e.target.value); if (!isNaN(n) && n !== val) updateConfig(config, n); }} />
      );
    }
    if (typeof val === 'string' && val.startsWith('#') && val.length === 7) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="color" value={val} onChange={(e) => updateConfig(config, e.target.value)}
            style={{ width: 36, height: 28, border: 'none', cursor: 'pointer', borderRadius: '0.25rem' }} />
          <code style={{ fontSize: '0.8rem' }}>{val}</code>
        </div>
      );
    }
    return (
      <input type="text" defaultValue={val} style={{ width: '100%', maxWidth: 250, padding: '0.3rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem' }}
        onBlur={(e) => { if (e.target.value !== val) updateConfig(config, e.target.value); }} />
    );
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading configs...</div>;

  return (
    <div>
      <div className="admin-table-header">
        <div>
          <h2>🎮 Game Configuration</h2>
          <p>Control all game settings, menus, features, and visuals from here. Changes apply to the frontend in real-time.</p>
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} className={`btn ${filter === 'all' ? 'btn-primary' : ''}`}
          style={{ fontSize: '0.85rem' }}>All ({configs.length})</button>
        {Object.entries(CATEGORY_LABELS).map(([key, val]) => {
          const count = configs.filter(c => c.category === key).length;
          return (
            <button key={key} onClick={() => setFilter(key)} className={`btn ${filter === key ? 'btn-primary' : ''}`}
              style={{ fontSize: '0.85rem' }}>
              {val.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Config list */}
      <div className="admin-table">
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '25%' }}>Key</th>
              <th style={{ width: '25%' }}>Value</th>
              <th style={{ width: '10%' }}>Category</th>
              <th style={{ width: '30%' }}>Description</th>
              <th style={{ width: '10%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(config => (
              <tr key={config.configKey} style={{ opacity: saving === config.configKey ? 0.5 : 1 }}>
                <td><code style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>{config.configKey}</code></td>
                <td>{renderValue(config)}</td>
                <td><span style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', background: 'var(--light-bg)', borderRadius: '0.25rem' }}>{config.category}</span></td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>{config.description}</td>
                <td>
                  <button onClick={() => deleteConfig(config.configKey)} className="btn btn-danger" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add new config */}
      <div style={{ marginTop: '2rem', background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: 'var(--shadow)' }}>
        <h3 style={{ marginBottom: '1rem' }}>➕ Add New Config</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '0.75rem', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Key</label>
            <input className="input" value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="config_key" />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Value</label>
            <input className="input" value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="value" />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Category</label>
            <select className="input" value={newCat} onChange={e => setNewCat(e.target.value)}>
              {Object.keys(CATEGORY_LABELS).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Description</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input className="input" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What this controls..." />
              <button onClick={addConfig} className="btn btn-primary">Add</button>
            </div>
          </div>
        </div>
      </div>

      {/* === WORLD EVENTS (Admin trigger) === */}
      <div className="admin-table-header" style={{ marginTop: '2rem' }}>
        <div>
          <h2>🌍 Global Events</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Trigger server-wide events that affect all players in real-time</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        {[
          { id: 'resource_surge', name: '⚡ Resource Surge', desc: 'All resource gains doubled for 10 min' },
          { id: 'xp_festival', name: '🎉 XP Festival', desc: 'Triple XP for all tasks for 15 min' },
          { id: 'invasion', name: '👾 Alien Invasion', desc: 'Enemy spawn rate 3x for 10 min' },
          { id: 'meteor_shower', name: '☄️ Meteor Shower', desc: 'Rare minerals from the sky for 8 min' },
          { id: 'trade_boom', name: '💰 Trade Boom', desc: 'Shop prices reduced 30% for 12 min' },
          { id: 'unity_call', name: '🤝 Unity Call', desc: 'Civilization points doubled for 10 min' },
          { id: 'knowledge_wave', name: '📚 Knowledge Wave', desc: 'Research speed doubled for 10 min' },
          { id: 'power_outage', name: '🔋 Power Outage', desc: 'Energy costs halved for 8 min' },
        ].map(ev => (
          <div key={ev.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.3rem' }}>{ev.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{ev.desc}</div>
            <button onClick={async () => {
              try {
                await api.post('/api/world/events/trigger', { eventId: ev.id });
                alert('Event triggered: ' + ev.name);
              } catch (e) { alert(e.response?.data?.error || 'Failed'); }
            }} className="btn btn-primary" style={{ width: '100%' }}>🚀 Trigger</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameConfig;

