import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './User.css';
import './Research.css';

const DOMAIN_COLORS = {
  'Personal Discipline': '#8b5cf6',
  'Physical Optimization': '#ef4444',
  'Mental Mastery': '#06b6d4',
  'Economic Growth': '#f59e0b',
  'Technical Innovation': '#3b82f6',
  'Governance & Stability': '#6366f1',
  'Social Cooperation': '#10b981',
  'Infrastructure Scaling': '#f97316',
  'Exploration & Expansion': '#ec4899',
  'Civilization Legacy': '#a855f7'
};

const DOMAIN_ICONS = {
  'Personal Discipline': '🧠', 'Physical Optimization': '🏋',
  'Mental Mastery': '🧬', 'Economic Growth': '💰',
  'Technical Innovation': '🛠', 'Governance & Stability': '🏛',
  'Social Cooperation': '🤝', 'Infrastructure Scaling': '🏗',
  'Exploration & Expansion': '🚀', 'Civilization Legacy': '🏆'
};

const Research = () => {
  const { user } = useAuth();
  const [nodes, setNodes] = useState([]);
  const [domains, setDomains] = useState({});
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [treeRes, domainsRes] = await Promise.all([
        axios.get('/api/research/tree'),
        axios.get('/api/research/domains')
      ]);
      setNodes(treeRes.data);
      setDomains(domainsRes.data);
    } catch (err) {
      console.error('Failed to fetch research data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartResearch = async (nodeId) => {
    setActionLoading(true);
    try {
      await axios.post(`/api/research/start/${nodeId}`);
      alert('Research started!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start research');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteResearch = async (nodeId) => {
    setActionLoading(true);
    try {
      const res = await axios.post(`/api/research/complete/${nodeId}`);
      alert(`Research completed! +${res.data.rewards.xp} XP`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Not ready yet');
    } finally {
      setActionLoading(false);
    }
  };

  const domainNodes = selectedDomain ? nodes.filter(n => n.domain === selectedDomain) : [];
  const tiers = [...new Set(domainNodes.map(n => n.tier))].sort((a, b) => a - b);

  if (loading) return <div className="loading">Loading research tree...</div>;

  return (
    <div className="research-container">
      <div className="research-header">
        <h1>🔬 Research Tree</h1>
        <p>1,000 nodes across 10 domains. Unlock multipliers and expand your civilization.</p>
        <div className="research-stats-bar">
          <span>💰 {user?.currency || 0}</span>
          <span>🧪 {user?.knowledgePoints || 0} KP</span>
          <span>📊 Tier {user?.researchTier || 0}</span>
          <span>✅ {nodes.filter(n => n.status === 'completed').length}/1000</span>
        </div>
      </div>

      {!selectedDomain ? (
        <div className="domain-grid">
          {Object.entries(DOMAIN_ICONS).map(([domain, icon]) => {
            const d = domains[domain] || { total: 100, completed: 0, maxTier: 0 };
            const pct = Math.round((d.completed / d.total) * 100);
            return (
              <div key={domain} className="domain-card" onClick={() => setSelectedDomain(domain)}
                style={{ borderColor: DOMAIN_COLORS[domain] }}>
                <div className="domain-card-icon">{icon}</div>
                <h3>{domain}</h3>
                <div className="domain-progress-bar">
                  <div className="domain-progress-fill" style={{ width: `${pct}%`, background: DOMAIN_COLORS[domain] }} />
                </div>
                <span className="domain-progress-text">{d.completed}/{d.total} ({pct}%)</span>
                <span className="domain-tier-text">Max Tier: {d.maxTier}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <button className="btn btn-secondary" onClick={() => { setSelectedDomain(null); setSelectedNode(null); }}
            style={{ marginBottom: '1rem' }}>
            ← Back to Domains
          </button>
          <h2 style={{ marginBottom: '1rem' }}>
            {DOMAIN_ICONS[selectedDomain]} {selectedDomain}
          </h2>

          <div className="tier-list">
            {tiers.map(tier => (
              <div key={tier} className="tier-section">
                <h3 className="tier-title">Tier {tier}</h3>
                <div className="node-grid">
                  {domainNodes.filter(n => n.tier === tier).map(node => (
                    <div key={node.nodeId}
                      className={`node-card node-${node.status}`}
                      onClick={() => setSelectedNode(node)}
                      style={{ borderLeftColor: DOMAIN_COLORS[selectedDomain] }}>
                      <div className="node-status-dot" />
                      <div className="node-name">{node.name}</div>
                      <div className="node-meta">
                        <span>💰{node.cost}</span>
                        <span>⭐{node.xpReward} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedNode && (
        <div className="node-modal-overlay" onClick={() => setSelectedNode(null)}>
          <div className="node-modal" onClick={e => e.stopPropagation()}>
            <div className="node-modal-header">
              <h2>{selectedNode.name}</h2>
              <button onClick={() => setSelectedNode(null)}>✕</button>
            </div>
            <div className="node-modal-body">
              <p className="node-id">{selectedNode.nodeId} • Tier {selectedNode.tier}</p>
              <p>{selectedNode.unlocks?.description}</p>
              <div className="node-detail-grid">
                <div><span>Cost</span><strong>💰 {selectedNode.cost}</strong></div>
                <div><span>Time</span><strong>⏱ {Math.ceil(selectedNode.researchTime / 60)}m</strong></div>
                <div><span>XP Reward</span><strong>⭐ {selectedNode.xpReward}</strong></div>
                <div><span>Multiplier</span><strong>×{selectedNode.unlocks?.globalMultiplier?.toFixed(3)}</strong></div>
              </div>
              {selectedNode.dependencies?.length > 0 && (
                <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  Requires: {selectedNode.dependencies.join(', ')}
                </p>
              )}
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                {selectedNode.status === 'available' && (
                  <button className="btn btn-primary" disabled={actionLoading}
                    onClick={() => handleStartResearch(selectedNode.nodeId)}>
                    {actionLoading ? 'Starting...' : `Research (💰${selectedNode.cost})`}
                  </button>
                )}
                {selectedNode.status === 'researching' && (
                  <button className="btn btn-secondary" disabled={actionLoading}
                    onClick={() => handleCompleteResearch(selectedNode.nodeId)}>
                    {actionLoading ? 'Completing...' : 'Complete Research'}
                  </button>
                )}
                {selectedNode.status === 'completed' && (
                  <span style={{ color: '#10b981', fontWeight: 600 }}>✅ Completed</span>
                )}
                {selectedNode.status === 'locked' && (
                  <span style={{ color: '#6b7280' }}>🔒 Locked — complete dependencies first</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Research;
