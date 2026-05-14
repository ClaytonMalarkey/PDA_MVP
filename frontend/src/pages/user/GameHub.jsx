import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './User.css';
import './GameHub.css';

const GameHub = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [generators, setGenerators] = useState([]);
  const [quests, setQuests] = useState([]);
  const [tab, setTab] = useState('hub');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);

  const showMsg = (msg) => { setActionMsg(msg); setTimeout(() => setActionMsg(null), 3000); };

  const fetchAll = useCallback(async () => {
    try {
      const [s, g, q] = await Promise.all([
        axios.get('/api/gameplay/status'),
        axios.get('/api/gameplay/generators'),
        axios.get('/api/gameplay/quests')
      ]);
      setStatus(s.data);
      setGenerators(g.data);
      setQuests(q.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const trainSkill = async (skill) => {
    try {
      const res = await axios.post(`/api/gameplay/train-skill/${skill}`);
      showMsg(res.data.message);
      fetchAll();
    } catch (err) { showMsg(err.response?.data?.error || 'Failed'); }
  };

  const upgradeHub = async () => {
    try {
      const res = await axios.post('/api/gameplay/upgrade-hub');
      showMsg(res.data.message);
      fetchAll();
    } catch (err) { showMsg(err.response?.data?.error || 'Failed'); }
  };

  const buyGen = async (id) => {
    try {
      const res = await axios.post(`/api/gameplay/generators/${id}/buy`);
      showMsg(res.data.message);
      fetchAll();
    } catch (err) { showMsg(err.response?.data?.error || 'Failed'); }
  };

  const automateGen = async (id) => {
    try {
      const res = await axios.post(`/api/gameplay/generators/${id}/automate`);
      showMsg(res.data.message);
      fetchAll();
    } catch (err) { showMsg(err.response?.data?.error || 'Failed'); }
  };

  const collectIncome = async () => {
    try {
      const res = await axios.post('/api/gameplay/collect-income');
      showMsg(`Collected 💰${res.data.collected} (${res.data.hours}h)`);
      fetchAll();
    } catch (err) { showMsg(err.response?.data?.error || 'Failed'); }
  };

  const completeQuest = async (questId) => {
    try {
      const res = await axios.post(`/api/gameplay/quests/${questId}/complete`);
      showMsg('Quest completed!');
      fetchAll();
    } catch (err) { showMsg(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="loading">Loading game...</div>;
  if (!status) return <div className="loading">Failed to load game data</div>;

  const hub = status.hub;
  const energyPct = Math.round((status.energy / status.maxEnergy) * 100);

  return (
    <div className="gamehub">
      {actionMsg && <div className="gamehub-toast">{actionMsg}</div>}

      {/* TOP BAR */}
      <div className="gamehub-topbar">
        <div className="gamehub-hub-badge">{hub.icon} {hub.name}</div>
        <div className="gamehub-energy">
          <span>⚡ {status.energy}/{status.maxEnergy}</span>
          <div className="energy-bar"><div className="energy-fill" style={{ width: `${energyPct}%` }} /></div>
        </div>
        <div className="gamehub-currencies">
          <span>💰 {user?.currency || 0}</span>
          <span>⭐ {user?.xp || 0} XP</span>
          <span>📈 {status.incomePerHour}/hr</span>
        </div>
      </div>

      {/* TABS */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <Link to="/play" style={{
          display: 'inline-block', padding: '0.75rem 2rem',
          background: 'linear-gradient(135deg, #ef4444, #f59e0b)', color: 'white',
          borderRadius: '0.75rem', fontWeight: 700, fontSize: '1.1rem',
          textDecoration: 'none', boxShadow: '0 4px 15px rgba(239,68,68,0.4)',
          transition: 'transform 0.15s'
        }}>
          🎮 PLAY GAME — Space Explorer
        </Link>
      </div>

      <div className="gamehub-tabs">
        {['hub', 'skills', 'income', 'quests'].map(t => (
          <button key={t} className={`gamehub-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'hub' ? '🏠 Hub' : t === 'skills' ? '🧠 Skills' : t === 'income' ? '💰 Income' : '📋 Quests'}
          </button>
        ))}
      </div>

      {/* HUB TAB */}
      {tab === 'hub' && (
        <div className="gamehub-section">
          <div className="hub-visual">
            <div className="hub-icon-large">{hub.icon}</div>
            <h2>{hub.name}</h2>
            <p className="hub-desc">{hub.description}</p>
            <div className="hub-stats-row">
              <span>Max Energy: {status.maxEnergy}</span>
              <span>Automation Slots: {status.automationUsed}/{status.automationSlots}</span>
              <span>Tasks Done: {status.totalTasksCompleted}</span>
            </div>
          </div>
          {status.nextHub && (
            <div className="hub-upgrade-card">
              <div>
                <strong>Next: {status.nextHub.icon} {status.nextHub.name}</strong>
                <p>Max Energy: {status.nextHub.maxEnergy} • Automation: {status.nextHub.automationSlots} slots</p>
              </div>
              <button className="btn btn-primary" onClick={upgradeHub}>
                Upgrade (💰{status.nextHub.cost})
              </button>
            </div>
          )}
          <div className="hub-quick-actions">
            <Link to="/tasks" className="hub-action-btn">✅ Do Tasks</Link>
            <Link to="/space" className="hub-action-btn">🌌 Space View</Link>
            <button className="hub-action-btn" onClick={collectIncome}>💰 Collect Income</button>
            <Link to="/research" className="hub-action-btn">🔬 Research</Link>
          </div>

          {/* PROGRESSION PATH */}
          <div className="progression-path">
            <h3>Your Journey</h3>
            <div className="progression-steps">
              {status.hubLevels.map((h, i) => (
                <div key={h.level} className={`progression-step ${user?.hubLevel >= h.level ? 'done' : user?.hubLevel === h.level - 1 ? 'next' : 'locked'}`}>
                  <div className="step-icon">{h.icon}</div>
                  <div className="step-name">{h.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SKILLS TAB */}
      {tab === 'skills' && (
        <div className="gamehub-section">
          <h2>🧠 Skill Trees</h2>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Train skills to unlock higher-paying tasks and income generators.</p>
          <div className="skills-grid">
            {Object.entries(status.skillDefs).map(([key, def]) => {
              const level = status.skills[key] || 0;
              const cost = 10 + level * 2;
              return (
                <div key={key} className="skill-card">
                  <div className="skill-header">
                    <span className="skill-icon">{def.icon}</span>
                    <div>
                      <strong>{def.name}</strong>
                      <span className="skill-level">Lv. {level}</span>
                    </div>
                  </div>
                  <p className="skill-desc">{def.desc}</p>
                  <div className="skill-bar">
                    <div className="skill-bar-fill" style={{ width: `${Math.min(level * 10, 100)}%` }} />
                  </div>
                  <button className="btn btn-secondary skill-train-btn" onClick={() => trainSkill(key)}>
                    Train (⚡{cost})
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* INCOME TAB */}
      {tab === 'income' && (
        <div className="gamehub-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2>💰 Income Generators</h2>
              <p style={{ color: '#6b7280' }}>Total: 📈 {status.incomePerHour}/hr</p>
            </div>
            <button className="btn btn-primary" onClick={collectIncome}>Collect Income</button>
          </div>
          <div className="generators-grid">
            {generators.map(gen => (
              <div key={gen.generatorId} className={`gen-card ${!gen.meetsRequirements ? 'gen-locked' : ''}`}>
                <div className="gen-header">
                  <span className="gen-icon">{gen.icon}</span>
                  <div>
                    <strong>{gen.name}</strong>
                    {gen.owned && <span className="gen-level">Lv.{gen.level}</span>}
                  </div>
                  {gen.isAutomated && <span className="gen-auto-badge">🤖 Auto</span>}
                </div>
                <p className="gen-desc">{gen.description}</p>
                {gen.owned && <p className="gen-income">💰 {gen.currentIncome.toFixed(0)}/hr</p>}
                <div className="gen-meta">
                  <span>{gen.category}</span>
                  {gen.requiredSkill && <span>{gen.requiredSkill} Lv.{gen.requiredSkillLevel}</span>}
                  <span>Hub Lv.{gen.requiredHubLevel}</span>
                </div>
                <div className="gen-actions">
                  {gen.meetsRequirements && (
                    <button className="btn btn-primary" onClick={() => buyGen(gen.generatorId)} disabled={!gen.canAfford}>
                      {gen.owned ? `Upgrade (💰${gen.upgradeCost})` : `Buy (💰${gen.upgradeCost})`}
                    </button>
                  )}
                  {gen.owned && !gen.isAutomated && status.automationUsed < status.automationSlots && (
                    <button className="btn btn-secondary" onClick={() => automateGen(gen.generatorId)}>🤖 Automate</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUESTS TAB */}
      {tab === 'quests' && (
        <div className="gamehub-section">
          <h2>📋 Quests & Missions</h2>
          {['daily', 'weekly', 'epic'].map(type => {
            const typeQuests = quests.filter(q => q.type === type);
            if (typeQuests.length === 0) return null;
            return (
              <div key={type} style={{ marginBottom: '1.5rem' }}>
                <h3 className="quest-type-title">
                  {type === 'daily' ? '📅 Daily' : type === 'weekly' ? '🗓️ Weekly' : '⭐ Epic'}
                </h3>
                <div className="quests-list">
                  {typeQuests.map(q => (
                    <div key={q.questId} className={`quest-card ${q.isCompleted ? 'quest-done' : ''}`}>
                      <div className="quest-info">
                        <span className="quest-icon">{q.icon}</span>
                        <div>
                          <strong>{q.title}</strong>
                          <p>{q.description}</p>
                        </div>
                      </div>
                      <div className="quest-rewards">
                        {q.rewards.xp > 0 && <span>⭐{q.rewards.xp}</span>}
                        {q.rewards.currency > 0 && <span>💰{q.rewards.currency}</span>}
                        {q.rewards.influencePoints > 0 && <span>⚡{q.rewards.influencePoints} IP</span>}
                        {q.rewards.legacyStones > 0 && <span>💎{q.rewards.legacyStones} LS</span>}
                      </div>
                      {q.isCompleted ? (
                        <span className="quest-done-badge">✅</span>
                      ) : (
                        <button className="btn btn-primary quest-claim-btn" onClick={() => completeQuest(q.questId)}>Claim</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GameHub;
