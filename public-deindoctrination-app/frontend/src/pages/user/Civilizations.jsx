import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './User.css';

const GOV_TYPES = {
  meritocratic: { icon: '⚡', desc: 'Leaders by productivity' },
  democratic: { icon: '🗳️', desc: 'Balanced voting' },
  technocratic: { icon: '🔬', desc: 'Research-weighted' },
  cooperative: { icon: '🤝', desc: 'Equal distribution' }
};

const Civilizations = () => {
  const { user } = useAuth();
  const [myCiv, setMyCiv] = useState(null);
  const [allCivs, setAllCivs] = useState([]);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', governanceType: 'democratic', icon: '🏛️', description: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [mineRes, allRes] = await Promise.all([
        axios.get('/api/civilizations/mine'),
        axios.get('/api/civilizations')
      ]);
      setMyCiv(mineRes.data);
      setAllCivs(allRes.data);
    } catch (err) {
      console.error('Failed to fetch civilizations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/civilizations', form);
      alert('Civilization created!');
      setCreating(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create');
    }
  };

  const handleJoin = async (civId) => {
    try {
      await axios.post(`/api/civilizations/join/${civId}`);
      alert('Joined!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to join');
    }
  };

  const handleLeave = async () => {
    if (!confirm('Leave your civilization?')) return;
    try {
      await axios.post('/api/civilizations/leave');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to leave');
    }
  };

  if (loading) return <div className="loading">Loading civilizations...</div>;

  return (
    <div style={{ width: '100%', padding: '0' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1>🏛️ Civilizations</h1>
        <p style={{ color: '#6b7280' }}>Join or create a civilization. Collaborate on research and mega-projects.</p>
      </div>

      {myCiv ? (
        <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>{myCiv.icon} {myCiv.name}</h2>
            <button className="btn btn-danger" onClick={handleLeave} style={{ fontSize: '0.85rem' }}>Leave</button>
          </div>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>{myCiv.description || 'No description'}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div className="empire-stat"><span className="stat-label">Governance</span><span className="stat-value">{GOV_TYPES[myCiv.governanceType]?.icon} {myCiv.governanceType}</span></div>
            <div className="empire-stat"><span className="stat-label">Stability</span><span className="stat-value">{myCiv.stabilityScore}%</span></div>
            <div className="empire-stat"><span className="stat-label">Members</span><span className="stat-value">{myCiv.members?.length || 0}</span></div>
            <div className="empire-stat"><span className="stat-label">Research Lv</span><span className="stat-value">{myCiv.researchLevel}</span></div>
          </div>
          <h3 style={{ marginBottom: '0.75rem' }}>Members</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {myCiv.members?.map(m => (
              <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#f9fafb', borderRadius: '0.375rem' }}>
                <span>{m.email} {m._id === myCiv.leaderId?._id ? '👑' : ''}</span>
                <span style={{ color: '#6b7280' }}>Rank {m.rank} • {m.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ marginBottom: '1rem' }}>You're not in a civilization yet.</p>
          <button className="btn btn-primary" onClick={() => setCreating(!creating)}>
            {creating ? 'Cancel' : '+ Create Civilization (50 IP)'}
          </button>
        </div>
      )}

      {creating && (
        <form onSubmit={handleCreate} style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Create Civilization</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input className="input" placeholder="Civilization Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <select className="input" value={form.governanceType} onChange={e => setForm({ ...form, governanceType: e.target.value })}>
              {Object.entries(GOV_TYPES).map(([k, v]) => <option key={k} value={k}>{v.icon} {k} — {v.desc}</option>)}
            </select>
            <textarea className="input" placeholder="Description" rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <button type="submit" className="btn btn-primary">Create</button>
          </div>
        </form>
      )}

      <h2 style={{ marginBottom: '1rem' }}>All Civilizations</h2>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {allCivs.map(civ => (
          <div key={civ._id} style={{ background: 'white', borderRadius: '0.5rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
            <div>
              <strong>{civ.icon} {civ.name}</strong>
              <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>
                {GOV_TYPES[civ.governanceType]?.icon} {civ.governanceType} • {civ.memberCount} members • Stability {civ.stabilityScore}%
              </span>
            </div>
            {!myCiv && (
              <button className="btn btn-secondary" onClick={() => handleJoin(civ._id)} style={{ fontSize: '0.85rem' }}>Join</button>
            )}
          </div>
        ))}
        {allCivs.length === 0 && <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No civilizations yet. Be the first to create one!</p>}
      </div>
    </div>
  );
};

export default Civilizations;
