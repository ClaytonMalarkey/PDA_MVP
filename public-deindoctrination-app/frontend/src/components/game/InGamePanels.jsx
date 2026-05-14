import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const S = { // FFT-inspired shared styles
  overlay: { position:'fixed',inset:0,background:'rgba(13,10,4,0.95)',zIndex:200,display:'flex',flexDirection:'column',color:'#f5e6c8',fontFamily:"Georgia,'Times New Roman',serif" },
  header: { display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.6rem 1rem',borderBottom:'2px solid #5c4a2a',background:'linear-gradient(180deg,#2a1f10,#1a1208)' },
  title: { fontSize:'1.1rem',fontWeight:700,margin:0,color:'#c9a84c',fontStyle:'italic' },
  close: { background:'none',border:'none',color:'#a08c6a',fontSize:'1.3rem',cursor:'pointer',padding:'0.3rem' },
  body: { flex:1,overflowY:'auto',padding:'0.75rem' },
  card: { background:'#1e1610',border:'1px solid #5c4a2a',borderRadius:'0.35rem',padding:'0.65rem',marginBottom:'0.5rem' },
  btn: { padding:'0.4rem 0.8rem',border:'2px solid #5c4a2a',borderRadius:'0.25rem',fontWeight:700,cursor:'pointer',fontSize:'0.8rem',transition:'opacity 0.15s',fontFamily:'inherit',background:'#2a1f10',color:'#f5e6c8' },
  row: { display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'0.8rem' },
  label: { color:'#a08c6a',fontSize:'0.7rem' },
  grid: { display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.4rem',marginBottom:'0.5rem' },
};

// === MISSIONS PANEL ===
export function MissionsPanel({ onClose }) {
  const [tasks, setTasks] = useState([]);
  const [cats, setCats] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [proofText, setProofText] = useState('');
  const [showProof, setShowProof] = useState(null);
  const [tab, setTab] = useState('generated'); // 'generated' | 'csv'

  const loadGenerated = (domain = null) => {
    setLoading(true);
    const url = domain ? `/api/gen-tasks/domain/${encodeURIComponent(domain)}?count=20` : '/api/gen-tasks/random?count=20';
    Promise.all([axios.get(url), axios.get('/api/gen-tasks/domains')])
      .then(([t, d]) => {
        setTasks(t.data || []);
        setCats(d.data || []);
      })
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  };

  const loadCSV = () => {
    setLoading(true);
    Promise.all([axios.get('/api/tasks'), axios.get('/api/categories')])
      .then(([t, c]) => {
        let all = Array.isArray(t.data) ? t.data : [];
        const seen = new Set(); const unique = [];
        for (const task of all) {
          const key = task.title?.trim().toLowerCase();
          if (key && !seen.has(key)) { seen.add(key); unique.push(task); }
        }
        for (let i = unique.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [unique[i], unique[j]] = [unique[j], unique[i]];
        }
        setTasks(unique);
        setCats(c.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadGenerated(); }, []);

  const switchTab = (t) => {
    setTab(t); setFilter('All');
    if (t === 'generated') loadGenerated();
    else loadCSV();
  };

  const complete = async (task, withProof = false) => {
    setCompleting(task.taskId);
    try {
      let r;
      if (task.isGenerated) {
        const body = { xpReward: task.xpReward, currencyReward: task.currencyReward, category: task.category, title: task.title };
        if (withProof && proofText.trim()) body.proof = proofText.trim();
        r = await axios.post(`/api/gen-tasks/complete/${task.taskId}`, body);
      } else {
        r = await axios.post(`/api/tasks/${task.taskId}/complete`);
      }
      const ai = r.data.aiVerification;
      let msgText = `✅ +${r.data.rewards?.xp || r.data.rewards?.xp}XP +${r.data.rewards?.currency}💰`;
      if (ai?.verified) msgText += ` 🤖 AI Verified (${ai.score}/100)!`;
      setSuccessMsg(msgText);
      setTasks(p => p.filter(t => t.taskId !== task.taskId));
      setShowProof(null); setProofText('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      setSuccessMsg('❌ ' + (e.response?.data?.error || 'Failed'));
      setTimeout(() => setSuccessMsg(null), 3000);
    } finally { setCompleting(null); }
  };

  const filtered = filter === 'All' ? tasks : tasks.filter(t => t.category === filter);
  const CAT_COLORS = ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16'];
  const TIER_COLORS = { Micro:'#64748b', Small:'#10b981', Medium:'#3b82f6', Large:'#f59e0b', Mega:'#ef4444' };

  return (
    <div style={S.overlay}>
      <div style={{...S.header, background:'linear-gradient(90deg,#064e3b,#0f172a)'}}>
        <h2 style={S.title}>✅ Mission Terminal</h2>
        <div style={{display:'flex',gap:'0.4rem',alignItems:'center'}}>
          <button onClick={()=>tab==='generated'?loadGenerated(filter==='All'?null:filter):loadCSV()}
            style={{...S.btn,background:'#1e293b',color:'#94a3b8',fontSize:'0.7rem'}}>🔄</button>
          <button style={S.close} onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{display:'flex',gap:'0.2rem',padding:'0.3rem',background:'#0a0f1a',borderBottom:'1px solid #1e293b'}}>
        <button onClick={()=>switchTab('generated')} style={{...S.btn,flex:1,background:tab==='generated'?'#10b981':'#1e293b',color:'white',fontSize:'0.75rem'}}>
          🤖 AI Generated
        </button>
        <button onClick={()=>switchTab('csv')} style={{...S.btn,flex:1,background:tab==='csv'?'#3b82f6':'#1e293b',color:'white',fontSize:'0.75rem'}}>
          📋 Task Library
        </button>
      </div>

      {successMsg && (
        <div style={{padding:'0.5rem 1rem',background:successMsg.startsWith('❌')?'#ef4444':'#10b981',color:'white',fontWeight:700,fontSize:'0.85rem',textAlign:'center'}}>
          {successMsg}
        </div>
      )}

      {/* Category filters */}
      <div style={{display:'flex',gap:'0.3rem',padding:'0.5rem 0.75rem',overflowX:'auto',flexShrink:0,background:'#0a0f1a'}}>
        <button onClick={()=>setFilter('All')} style={{...S.btn,background:filter==='All'?'#10b981':'#1e293b',color:'white',whiteSpace:'nowrap',fontSize:'0.7rem'}}>
          All ({tasks.length})
        </button>
        {cats.map((c,i)=>{
          const name = c.name || c;
          const icon = c.icon || '';
          const count = tasks.filter(t=>t.category===name).length;
          return <button key={name} onClick={()=>setFilter(name)}
            style={{...S.btn,background:filter===name?CAT_COLORS[i%CAT_COLORS.length]:'#1e293b',color:'white',whiteSpace:'nowrap',fontSize:'0.7rem'}}>
            {icon} {name.split(' ')[0]} ({count})
          </button>;
        })}
      </div>

      <div style={S.body}>
        {loading ? (
          <div style={{textAlign:'center',padding:'2rem',color:'#64748b'}}>
            <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>⏳</div>
            {tab==='generated'?'Generating missions...':'Loading task library...'}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{textAlign:'center',padding:'2rem',color:'#64748b'}}>
            <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>📭</div>
            No missions available
          </div>
        ) : (
          filtered.map((t, idx) => (
            <div key={t.taskId || idx} style={{...S.card, borderLeft:`3px solid ${CAT_COLORS[idx % CAT_COLORS.length]}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'0.5rem'}}>
                <div style={{flex:1,cursor:'pointer'}} onClick={()=>setShowProof(showProof===t.taskId?null:t.taskId)}>
                  <div style={{fontWeight:700,fontSize:'0.88rem',marginBottom:'0.15rem',color:'#e2e8f0'}}>{t.title}</div>
                  <div style={{fontSize:'0.72rem',color:'#64748b',marginBottom:'0.35rem',lineHeight:1.3}}>
                    {t.description?.substring(0, 100)}{t.description?.length > 100 ? '...' : ''}
                  </div>
                  <div style={{display:'flex',gap:'0.6rem',fontSize:'0.75rem',flexWrap:'wrap',alignItems:'center'}}>
                    <span style={{color:'#fbbf24'}}>⭐ {t.xpReward} XP</span>
                    <span style={{color:'#10b981'}}>💰 {t.currencyReward}</span>
                    {t.tier && <span style={{color:TIER_COLORS[t.tier]||'#64748b',background:'#1e293b',padding:'0.05rem 0.3rem',borderRadius:'1rem',fontSize:'0.6rem',fontWeight:700}}>{t.tier}</span>}
                    {t.realReward && t.realReward !== 'None' && <span style={{color:'#ec4899'}}>🎁 {t.realReward}</span>}
                    <span style={{color:'#64748b',fontSize:'0.65rem'}}>{t.category}</span>
                  </div>
                </div>
                <button onClick={()=>complete(t)} disabled={completing===t.taskId}
                  style={{...S.btn,background:completing===t.taskId?'#374151':'#10b981',color:'white',
                    padding:'0.5rem 0.75rem',fontSize:'0.82rem',flexShrink:0,minWidth:70}}>
                  {completing===t.taskId ? '...' : '✓ Do'}
                </button>
              </div>
              {/* AI Proof section — expands on click */}
              {showProof===t.taskId && (
                <div style={{marginTop:'0.5rem',paddingTop:'0.5rem',borderTop:'1px solid #1e293b'}}>
                  <div style={{fontSize:'0.72rem',color:'#94a3b8',marginBottom:'0.3rem',fontWeight:700}}>
                    🤖 AI Verification — describe what you did for bonus XP
                  </div>
                  <textarea value={proofText} onChange={e=>setProofText(e.target.value)}
                    placeholder="What did you do? What did you learn? Any results?"
                    style={{width:'100%',padding:'0.4rem',background:'#1e293b',border:'1px solid #334155',
                      borderRadius:'0.3rem',color:'#e2e8f0',fontSize:'0.8rem',resize:'vertical',
                      minHeight:'50px',boxSizing:'border-box',fontFamily:'inherit'}} />
                  <div style={{display:'flex',gap:'0.4rem',marginTop:'0.3rem'}}>
                    <button onClick={()=>complete(t,true)} disabled={completing===t.taskId||!proofText.trim()}
                      style={{flex:1,padding:'0.4rem',background:proofText.trim()?'#6366f1':'#374151',
                        color:'white',border:'none',borderRadius:'0.3rem',fontWeight:700,
                        cursor:proofText.trim()?'pointer':'not-allowed',fontSize:'0.78rem'}}>
                      🤖 Verify & Complete
                    </button>
                    <button onClick={()=>complete(t,false)} disabled={completing===t.taskId}
                      style={{padding:'0.4rem 0.6rem',background:'#10b981',color:'white',border:'none',
                        borderRadius:'0.3rem',fontWeight:700,cursor:'pointer',fontSize:'0.78rem'}}>
                      Quick ✅
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// === EMPIRE PANEL ===
export function EmpirePanel({ onClose }) {
  const { user } = useAuth();
  const [structs, setStructs] = useState([]);
  const [userStructs, setUserStructs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([axios.get('/api/empire/structures'), axios.get('/api/empire/my-structures')])
      .then(([s, u]) => { setStructs(s.data); setUserStructs(u.data); })
      .finally(() => setLoading(false));
  }, []);

  const purchase = async (id) => {
    try { await axios.post(`/api/empire/structures/${id}/purchase`); alert('Purchased!'); window.location.reload(); } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };
  const upgrade = async (id) => {
    try { await axios.post(`/api/empire/structures/${id}/upgrade`); alert('Upgraded!'); window.location.reload(); } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  return (
    <div style={S.overlay}>
      <div style={S.header}><h2 style={S.title}>🏛️ Empire</h2><button style={S.close} onClick={onClose}>✕</button></div>
      <div style={S.body}>
        <div style={S.grid}>
          <div style={S.card}><div style={S.label}>Structures</div><div style={{ fontWeight:700 }}>{userStructs.length}</div></div>
          <div style={S.card}><div style={S.label}>Currency</div><div style={{ fontWeight:700 }}>💰 {user?.currency || 0}</div></div>
        </div>
        {loading ? <p style={{ color:'#64748b' }}>Loading...</p> :
          structs.map(s => {
            const owned = userStructs.find(u => u.structureId === s.structureId);
            return (
              <div key={s.structureId} style={S.card}>
                <div style={S.row}><strong>{s.icon || '🏛️'} {s.name}</strong>{owned && <span style={{ color:'#10b981',fontSize:'0.75rem' }}>Lv.{owned.level}</span>}</div>
                <div style={{ fontSize:'0.72rem',color:'#64748b',margin:'0.2rem 0' }}>{s.description}</div>
                <div style={S.row}>
                  <span style={{ fontSize:'0.75rem' }}>💰{owned ? Math.floor(s.baseCost * Math.pow(1.15, owned.level)) : s.baseCost}</span>
                  <button onClick={() => owned ? upgrade(s.structureId) : purchase(s.structureId)} style={{ ...S.btn, background:'#6366f1', color:'white' }}>
                    {owned ? 'Upgrade' : 'Buy'}
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// === RESEARCH PANEL ===
export function ResearchPanel({ onClose }) {
  const [domains, setDomains] = useState({});
  const [nodes, setNodes] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/research/domains')
      .then(r => setDomains(r.data || {}))
      .catch(e => setError('Failed to load research: ' + (e.response?.data?.error || e.message)))
      .finally(() => setLoading(false));
  }, []);

  const loadDomain = async (name) => {
    setSelectedDomain(name);
    try {
      const r = await axios.get('/api/research/tree');
      setNodes((r.data || []).filter(n => n.domain === name).sort((a, b) => a.tier - b.tier));
    } catch (e) { setError('Failed to load nodes'); }
  };

  const startResearch = async (nodeId) => {
    try {
      await axios.post('/api/research/start/' + nodeId);
      alert('Research started!');
      loadDomain(selectedDomain);
    } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const completeResearch = async (nodeId) => {
    try {
      const r = await axios.post('/api/research/complete/' + nodeId);
      alert('Research completed! +' + r.data.rewards.xp + ' XP');
      loadDomain(selectedDomain);
    } catch (e) { alert(e.response?.data?.error || 'Not ready yet'); }
  };

  const ICONS = { 'Personal Discipline':'🧠','Physical Optimization':'🏋','Mental Mastery':'🧬','Economic Growth':'💰','Technical Innovation':'🛠','Governance & Stability':'🏛','Social Cooperation':'🤝','Infrastructure Scaling':'🏗','Exploration & Expansion':'🚀','Civilization Legacy':'🏆' };
  const COLORS = { 'Personal Discipline':'#8b5cf6','Physical Optimization':'#ef4444','Mental Mastery':'#06b6d4','Economic Growth':'#f59e0b','Technical Innovation':'#3b82f6','Governance & Stability':'#6366f1','Social Cooperation':'#10b981','Infrastructure Scaling':'#f97316','Exploration & Expansion':'#ec4899','Civilization Legacy':'#a855f7' };
  const STATUS_COLORS = { completed:'#4aaa4a', available:'#c9a84c', researching:'#4a7acc', locked:'#3a2a1a' };

  return (
    <div style={S.overlay}>
      <div style={{...S.header, background:'linear-gradient(90deg,#1a1a3a,#1a1208)'}}>
        <h2 style={S.title}>🔬 Research Tree (1,000 nodes)</h2>
        <button style={S.close} onClick={onClose}>✕</button>
      </div>
      <div style={S.body}>
        {error && <div style={{padding:'0.4rem',background:'#5a1a1a',color:'#fc8181',borderRadius:'0.3rem',marginBottom:'0.5rem',fontSize:'0.8rem'}}>{error}</div>}
        {loading ? <div style={{textAlign:'center',padding:'2rem',color:'#a08c6a'}}>Loading research...</div> :
        !selectedDomain ? (
          <div>
            <p style={{color:'#a08c6a',fontSize:'0.78rem',marginBottom:'0.75rem'}}>10 domains × 100 nodes each. Research to unlock multipliers.</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:'0.4rem'}}>
              {Object.entries(ICONS).map(([name, icon]) => {
                const d = domains[name] || { total: 100, completed: 0, maxTier: 0 };
                const pct = Math.round((d.completed / d.total) * 100);
                return (
                  <div key={name} onClick={() => loadDomain(name)} style={{...S.card, cursor:'pointer', borderColor:(COLORS[name]||'#5c4a2a')+'60'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'0.3rem',marginBottom:'0.3rem'}}>
                      <span style={{fontSize:'1.3rem'}}>{icon}</span>
                      <strong style={{fontSize:'0.78rem',color:COLORS[name]||'#c9a84c'}}>{name.split(' ')[0]}</strong>
                    </div>
                    <div style={{height:5,background:'#1a1208',borderRadius:3,overflow:'hidden'}}>
                      <div style={{height:'100%',width:pct+'%',background:COLORS[name]||'#c9a84c',borderRadius:3}} />
                    </div>
                    <div style={{fontSize:'0.6rem',color:'#a08c6a',marginTop:'0.15rem'}}>{d.completed}/{d.total} · Tier {d.maxTier}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <button onClick={() => {setSelectedDomain(null);setNodes([]);}} style={{...S.btn, background:'#2a1f10', color:'#a08c6a', marginBottom:'0.5rem'}}>← All Domains</button>
            <h3 style={{color:COLORS[selectedDomain]||'#c9a84c',marginBottom:'0.4rem'}}>{ICONS[selectedDomain]} {selectedDomain}</h3>
            {nodes.length === 0 ? <div style={{color:'#a08c6a',textAlign:'center',padding:'1rem'}}>Loading nodes...</div> :
              nodes.slice(0, 30).map(n => (
                <div key={n.nodeId} style={{...S.card, borderLeft:'3px solid '+STATUS_COLORS[n.status||'locked'], opacity:n.status==='locked'?0.5:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <strong style={{color:'#f5e6c8',fontSize:'0.82rem'}}>{n.name}</strong>
                      <div style={{fontSize:'0.63rem',color:'#a08c6a'}}>Tier {n.tier} · 💰{n.cost} · ⭐{n.xpReward}XP · ⏱{Math.ceil(n.researchTime/60)}min</div>
                    </div>
                    {n.status==='available' && <button onClick={() => startResearch(n.nodeId)} style={{...S.btn,background:'#c9a84c',color:'#1a1208',fontSize:'0.68rem'}}>Research</button>}
                    {n.status==='researching' && <button onClick={() => completeResearch(n.nodeId)} style={{...S.btn,background:'#4a7acc',color:'#fff',fontSize:'0.68rem'}}>Complete</button>}
                    {n.status==='completed' && <span style={{color:'#4aaa4a',fontSize:'0.7rem',fontWeight:700}}>✅</span>}
                    {n.status==='locked' && <span style={{color:'#3a2a1a',fontSize:'0.7rem'}}>🔒</span>}
                  </div>
                  {n.unlocks?.description && <div style={{fontSize:'0.6rem',color:'#5c4a2a',marginTop:'0.1rem'}}>{n.unlocks.description}</div>}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// === SKILLS PANEL ===
export function SkillsPanel({ onClose }) {
  const [status, setStatus] = useState(null);
  useEffect(() => { axios.get('/api/gameplay/status').then(r => setStatus(r.data)); }, []);

  const train = async (skill) => {
    try { const r = await axios.post(`/api/gameplay/train-skill/${skill}`); alert(r.data.message); setStatus(null); axios.get('/api/gameplay/status').then(r2 => setStatus(r2.data)); } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  return (
    <div style={S.overlay}>
      <div style={S.header}><h2 style={S.title}>⚡ Skills & Income</h2><button style={S.close} onClick={onClose}>✕</button></div>
      <div style={S.body}>
        {!status ? <p style={{ color:'#64748b' }}>Loading...</p> : <>
          <div style={S.grid}>
            <div style={S.card}><div style={S.label}>Hub</div><div style={{ fontWeight:700 }}>{status.hub?.icon} {status.hub?.name}</div></div>
            <div style={S.card}><div style={S.label}>Income</div><div style={{ fontWeight:700 }}>📈 {status.incomePerHour}/hr</div></div>
          </div>
          <h3 style={{ fontSize:'0.85rem',marginBottom:'0.5rem',color:'#94a3b8' }}>Skills</h3>
          {Object.entries(status.skillDefs || {}).map(([key, def]) => (
            <div key={key} style={S.card}>
              <div style={S.row}><span>{def.icon} {def.name} <span style={{ color:'#6366f1' }}>Lv.{status.skills?.[key] || 0}</span></span>
                <button onClick={() => train(key)} style={{ ...S.btn, background:'#10b981', color:'white' }}>Train (⚡{10 + (status.skills?.[key] || 0) * 2})</button>
              </div>
            </div>
          ))}
        </>}
      </div>
    </div>
  );
}

// === SHOP PANEL ===
export function ShopPanel({ onClose }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('credits');
  const [msg, setMsg] = useState(null);

  useEffect(() => { axios.get('/api/shop/items').then(r => setItems(r.data||[])).finally(() => setLoading(false)); }, []);

  const buyCredits = async (id) => {
    try {
      const r = await axios.post('/api/checkout/buy/'+id, { method: 'auto' });
      if (r.data.mode === 'stripe' && r.data.url) {
        window.location.href = r.data.url;
      } else if (r.data.mode === 'paypal' && r.data.approveUrl) {
        window.location.href = r.data.approveUrl;
      } else {
        setMsg({text:'✅ '+r.data.message,type:'success'});
        // Refresh user data so currency/premium updates show
        try { const u = await axios.get('/api/auth/verify'); if(u.data?.user) window.dispatchEvent(new CustomEvent('user-updated',{detail:u.data.user})); } catch(e){}
        setTimeout(()=>setMsg(null),3000);
      }
    } catch(e) { setMsg({text:e.response?.data?.error||'Checkout failed',type:'error'}); setTimeout(()=>setMsg(null),3000); }
  };

  const buyWithCredits = async (id) => {
    try {
      const r = await axios.post('/api/shop/buy/'+id);
      setMsg({text:r.data.message,type:'success'});
      setTimeout(()=>setMsg(null),3000);
    } catch(e) { setMsg({text:e.response?.data?.error||'Failed',type:'error'}); setTimeout(()=>setMsg(null),3000); }
  };

  const adReward = async (type) => {
    try { const r = await axios.post('/api/shop/ad-reward',{rewardType:type}); setMsg({text:r.data.message,type:'success'}); setTimeout(()=>setMsg(null),3000); }
    catch(e) { setMsg({text:e.response?.data?.error||'Failed',type:'error'}); setTimeout(()=>setMsg(null),3000); }
  };

  const creditPacks = items.filter(i=>i.category==='currency_pack'&&i.priceUSD>0);
  const energyItems = items.filter(i=>i.category==='energy');
  const boosters = items.filter(i=>i.category==='booster');
  const premiumItems = items.filter(i=>i.category==='premium');

  const tabs = [['credits','💰','Credits'],['energy','⚡','Energy'],['resources','📦','Resources'],['premium','⭐','Premium'],['free','🎬','Free']];

  return (
    <div style={S.overlay}>
      <div style={{...S.header,background:'linear-gradient(90deg,#4a1a3a,#1a1208)'}}>
        <h2 style={S.title}>🛒 Market</h2>
        <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
          <span style={{fontSize:'0.75rem',color:'#c9a84c'}}>💰{user?.currency||0}</span>
          <button style={S.close} onClick={onClose}>✕</button>
        </div>
      </div>

      {msg&&<div style={{padding:'0.4rem',background:msg.type==='success'?'#2a6a2a':'#6a2a2a',color:'#f5e6c8',textAlign:'center',fontWeight:700,fontSize:'0.85rem'}}>{msg.text}</div>}

      <div style={{display:'flex',gap:'0.2rem',padding:'0.3rem',background:'#0a0804',borderBottom:'1px solid #5c4a2a'}}>
        {tabs.map(([id,icon,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{...S.btn,flex:1,background:tab===id?'#5c4a2a':'#1a1208',color:tab===id?'#c9a84c':'#a08c6a',fontSize:'0.7rem',padding:'0.3rem',border:tab===id?'1px solid #c9a84c':'1px solid #3a2a1a'}}>
            {icon} {label}
          </button>
        ))}
      </div>

      <div style={S.body}>
        {loading?<div style={{textAlign:'center',padding:'2rem',color:'#a08c6a'}}>Loading shop...</div>:

        tab==='credits'?<div>
          <p style={{color:'#a08c6a',fontSize:'0.75rem',marginBottom:'0.5rem'}}>Buy credits with real money. Credits are used to purchase everything else in the shop.</p>
          {creditPacks.map(i=>(
            <div key={i.itemId} style={{...S.card,borderLeft:i.isFeatured?'3px solid #c9a84c':'3px solid #5c4a2a'}}>
              {i.isFeatured&&<div style={{fontSize:'0.6rem',color:'#c9a84c',fontWeight:700,marginBottom:'0.2rem'}}>⭐ BEST VALUE</div>}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <span style={{fontSize:'1.2rem'}}>{i.icon}</span>
                  <strong style={{color:'#f5e6c8',marginLeft:'0.3rem'}}>{i.name}</strong>
                  <div style={{fontSize:'0.68rem',color:'#a08c6a'}}>{i.description}</div>
                </div>
                <button onClick={()=>buyCredits(i.itemId)} style={{...S.btn,background:'linear-gradient(135deg,#c9a84c,#8b6914)',color:'#1a1208',fontSize:'0.82rem',padding:'0.4rem 0.8rem',border:'2px solid #c9a84c'}}>
                  ${i.priceUSD.toFixed(2)}
                </button>
              </div>
            </div>
          ))}
        </div>:

        tab==='energy'?<div>
          <p style={{color:'#a08c6a',fontSize:'0.75rem',marginBottom:'0.5rem'}}>Refill energy to keep playing. Energy regenerates over time for free.</p>
          {energyItems.map(i=>(
            <div key={i.itemId} style={S.card}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <span style={{fontSize:'1.1rem'}}>{i.icon}</span>
                  <strong style={{color:'#f5e6c8',marginLeft:'0.3rem'}}>{i.name}</strong>
                  <div style={{fontSize:'0.68rem',color:'#a08c6a'}}>{i.description}{i.purchaseLimit?' (limit: '+i.purchaseLimit+')':''}</div>
                </div>
                <div style={{display:'flex',gap:'0.3rem'}}>
                  {i.priceCurrency>0&&<button onClick={()=>buyWithCredits(i.itemId)} style={{...S.btn,background:'#2a6a2a',color:'#f5e6c8',fontSize:'0.75rem'}}>💰{i.priceCurrency}</button>}
                  {i.priceUSD>0&&<button onClick={()=>buyCredits(i.itemId)} style={{...S.btn,background:'#c9a84c',color:'#1a1208',fontSize:'0.75rem'}}>${i.priceUSD.toFixed(2)}</button>}
                </div>
              </div>
            </div>
          ))}
        </div>:

        tab==='resources'?<div>
          <p style={{color:'#a08c6a',fontSize:'0.75rem',marginBottom:'0.5rem'}}>Buy resources with credits. Small amounts to supplement your gameplay.</p>
          {boosters.map(i=>(
            <div key={i.itemId} style={S.card}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <span style={{fontSize:'1.1rem'}}>{i.icon}</span>
                  <strong style={{color:'#f5e6c8',marginLeft:'0.3rem'}}>{i.name}</strong>
                  <div style={{fontSize:'0.68rem',color:'#a08c6a'}}>{i.description}</div>
                  <div style={{fontSize:'0.62rem',color:'#5c4a2a',marginTop:'0.1rem'}}>
                    {i.rewards.knowledgePoints>0&&'📖+'+i.rewards.knowledgePoints+' '}
                    {i.rewards.influencePoints>0&&'📢+'+i.rewards.influencePoints+' '}
                    {i.rewards.innovationTokens>0&&'🔧+'+i.rewards.innovationTokens+' '}
                    {i.rewards.legacyStones>0&&'🏛️+'+i.rewards.legacyStones+' '}
                    {i.rewards.xp>0&&'⭐+'+i.rewards.xp+' '}
                  </div>
                </div>
                <button onClick={()=>buyWithCredits(i.itemId)} style={{...S.btn,background:'#2a6a2a',color:'#f5e6c8',fontSize:'0.75rem'}}>💰{i.priceCurrency}</button>
              </div>
            </div>
          ))}
        </div>:

        tab==='premium'?<div>
          <p style={{color:'#a08c6a',fontSize:'0.75rem',marginBottom:'0.5rem'}}>Premium subscriptions for enhanced rewards and features.</p>
          {premiumItems.map(i=>(
            <div key={i.itemId} style={{...S.card,borderLeft:'3px solid #c9a84c'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <span style={{fontSize:'1.1rem'}}>{i.icon}</span>
                  <strong style={{color:'#f5e6c8',marginLeft:'0.3rem'}}>{i.name}</strong>
                  <div style={{fontSize:'0.68rem',color:'#a08c6a'}}>{i.description}</div>
                </div>
                <button onClick={()=>buyCredits(i.itemId)} style={{...S.btn,background:'#c9a84c',color:'#1a1208',fontSize:'0.75rem'}}>${i.priceUSD.toFixed(2)}</button>
              </div>
            </div>
          ))}
          <div style={{...S.card,background:'#2a1f10',marginTop:'0.5rem'}}>
            <div style={{fontSize:'0.72rem',color:'#c9a84c',fontWeight:700,marginBottom:'0.3rem'}}>⭐ Premium Benefits</div>
            <div style={{fontSize:'0.65rem',color:'#a08c6a',lineHeight:1.5}}>
              🚫 No ads · 1.5× rewards · 24h idle cap · Priority tasks · Exclusive ship colors · Premium badge
            </div>
          </div>
        </div>:

        tab==='free'?<div>
          <p style={{color:'#a08c6a',fontSize:'0.75rem',marginBottom:'0.5rem'}}>Watch a short ad to earn free rewards. Available every 5 minutes.</p>
          <div style={{...S.card,background:'linear-gradient(135deg,#2a1f10,#3a2a1a)'}}>
            <div style={{fontWeight:700,marginBottom:'0.5rem',color:'#c9a84c'}}>🎬 Watch Ad — Choose Reward</div>
            <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
              {[['currency','💰 +50 Credits'],['energy','⚡ +30 Energy'],['xp_boost','⭐ +100 XP']].map(([t,l])=>(
                <button key={t} onClick={()=>adReward(t)} style={{...S.btn,background:'#c9a84c',color:'#1a1208',flex:1,textAlign:'center',fontSize:'0.75rem'}}>{l}</button>
              ))}
            </div>
          </div>
        </div>:null}
      </div>
    </div>
  );
}

// === LEADERBOARD PANEL ===
export function LeaderboardPanel({ onClose }) {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  useEffect(() => { axios.get('/api/leaderboard').then(r => setLeaders(Array.isArray(r.data) ? r.data : r.data?.leaderboard || [])); }, []);

  return (
    <div style={S.overlay}>
      <div style={S.header}><h2 style={S.title}>🏆 Leaderboard</h2><button style={S.close} onClick={onClose}>✕</button></div>
      <div style={S.body}>
        {leaders.slice(0, 20).map((e, i) => (
          <div key={i} style={{ ...S.card, background: e.email === user?.email ? '#1e1b4b' : '#0f172a', borderColor: e.email === user?.email ? '#6366f1' : '#1e293b' }}>
            <div style={S.row}>
              <span style={{ fontWeight:700,fontSize:'1rem',color:'#fbbf24',width:30 }}>#{i + 1}</span>
              <span style={{ flex:1,fontSize:'0.82rem' }}>{e.email || e.username || 'User'}</span>
              <span style={{ color:'#10b981',fontWeight:700,fontSize:'0.82rem' }}>{e.xp || 0} XP</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// === ALLIANCE PANEL ===
export function AlliancePanel({ onClose }) {
  const [myCiv, setMyCiv] = useState(null);
  const [allCivs, setAllCivs] = useState([]);
  useEffect(() => {
    Promise.all([axios.get('/api/civilizations/mine'), axios.get('/api/civilizations')])
      .then(([m, a]) => { setMyCiv(m.data); setAllCivs(a.data); });
  }, []);

  const join = async (id) => { try { await axios.post(`/api/civilizations/join/${id}`); alert('Joined!'); window.location.reload(); } catch (e) { alert(e.response?.data?.error || 'Failed'); } };

  return (
    <div style={S.overlay}>
      <div style={S.header}><h2 style={S.title}>🤝 Alliance</h2><button style={S.close} onClick={onClose}>✕</button></div>
      <div style={S.body}>
        {myCiv ? (
          <div style={{ ...S.card, borderColor:'#6366f1' }}>
            <div style={{ fontWeight:700,fontSize:'1rem',marginBottom:'0.3rem' }}>{myCiv.icon} {myCiv.name}</div>
            <div style={S.grid}>
              <div><span style={S.label}>Members</span><div>{myCiv.members?.length || 0}</div></div>
              <div><span style={S.label}>Stability</span><div>{myCiv.stabilityScore}%</div></div>
            </div>
          </div>
        ) : <p style={{ color:'#64748b',marginBottom:'0.75rem' }}>Not in an alliance yet</p>}
        <h3 style={{ fontSize:'0.85rem',color:'#94a3b8',marginBottom:'0.5rem' }}>All Alliances</h3>
        {allCivs.map(c => (
          <div key={c._id} style={S.card}>
            <div style={S.row}>
              <span>{c.icon} {c.name} ({c.memberCount || c.members?.length || 0})</span>
              {!myCiv && <button onClick={() => join(c._id)} style={{ ...S.btn, background:'#10b981', color:'white' }}>Join</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// === TASKS PANEL (browse + complete all tasks) ===
export function TasksPanel({ onClose }) {
  const [tasks, setTasks] = useState([]);
  const [dailyQuests, setDailyQuests] = useState([]);
  const [weeklyChallenge, setWeeklyChallenge] = useState(null);
  const [domains, setDomains] = useState([]);
  const [filter, setFilter] = useState('All');
  const [tab, setTab] = useState('daily'); // 'daily' | 'personalized' | 'browse'
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [completing, setCompleting] = useState(null);
  const [msg, setMsg] = useState(null);
  const [proofText, setProofText] = useState('');
  const [showProof, setShowProof] = useState(null);
  const [timeSpent, setTimeSpent] = useState({});
  const [timerStart, setTimerStart] = useState({});

  useEffect(() => {
    loadTab('daily');
    axios.get('/api/gen-tasks/domains').then(r => setDomains(r.data || [])).catch(() => {});
  }, []);

  const loadTab = (t) => {
    setTab(t); setLoading(true); setFilter('All');
    let url;
    if (t === 'daily') url = '/api/gen-tasks/daily';
    else if (t === 'personalized') url = '/api/gen-tasks/personalized?count=20';
    else url = '/api/gen-tasks/random?count=20';

    const promises = [axios.get(url)];
    if (t === 'daily') promises.push(axios.get('/api/gen-tasks/weekly'));

    Promise.all(promises)
      .then(([t_res, w_res]) => {
        setTasks(Array.isArray(t_res.data) ? t_res.data : []);
        if (w_res) setWeeklyChallenge(w_res.data);
      })
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  };

  const startTimer = (taskId) => {
    setTimerStart(prev => ({ ...prev, [taskId]: Date.now() }));
  };

  const complete = async (task, withProof = false) => {
    setCompleting(task.taskId);
    const elapsed = timerStart[task.taskId] ? Math.floor((Date.now() - timerStart[task.taskId]) / 1000) : 0;
    try {
      const body = {
        xpReward: task.xpReward, currencyReward: task.currencyReward,
        category: task.category, title: task.title, tier: task.tier
      };
      if (withProof && proofText.trim()) {
        body.proof = proofText.trim();
        body.metadata = { timeSpent: elapsed };
      }
      const r = await axios.post(`/api/gen-tasks/complete/${task.taskId}`, body);
      const ai = r.data.aiVerification;
      const combo = r.data.combo;
      let msgText = `✅ +${r.data.rewards.xp}XP +${r.data.rewards.currency}💰`;
      if (ai?.verified) msgText += ` 🤖 AI ${ai.score}/100`;
      if (combo) msgText += ` ${combo}`;
      if (r.data.rareDrops?.length > 0) msgText += ` 🎁 Rare drop!`;
      setMsg({ text: msgText, type: 'success' });
      setTasks(prev => prev.filter(t => t.taskId !== task.taskId));
      setSelected(null); setShowProof(null); setProofText('');
    } catch (e) {
      setMsg({ text: `❌ ${e.response?.data?.error || 'Failed'}`, type: 'error' });
    } finally {
      setCompleting(null);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const filtered = filter === 'All' ? tasks : tasks.filter(t => t.category === filter);
  const CC = ['#10b981','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16'];
  const TIER_COLORS = { Micro:'#64748b', Small:'#10b981', Medium:'#3b82f6', Large:'#f59e0b', Mega:'#ef4444', Daily:'#ec4899', Weekly:'#f59e0b' };

  return (
    <div style={S.overlay}>
      <div style={{...S.header, background:'linear-gradient(90deg,#0c4a6e,#0f172a)'}}>
        <h2 style={S.title}>📋 Task Engine</h2>
        <div style={{display:'flex',gap:'0.4rem',alignItems:'center'}}>
          <button onClick={()=>loadTab(tab)} style={{...S.btn,background:'#1e293b',color:'#94a3b8',fontSize:'0.75rem'}}>🔄</button>
          <button style={S.close} onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{display:'flex',gap:'0.2rem',padding:'0.3rem',background:'#0a0f1a',borderBottom:'1px solid #1e293b'}}>
        {[['daily','📅 Daily','#ec4899'],['personalized','🎯 For You','#6366f1'],['browse','🌍 Browse','#10b981']].map(([id,label,col])=>(
          <button key={id} onClick={()=>loadTab(id)}
            style={{...S.btn,flex:1,background:tab===id?col:'#1e293b',color:'white',fontSize:'0.72rem'}}>
            {label}
          </button>
        ))}
      </div>

      {msg && <div style={{padding:'0.5rem 1rem',background:msg.type==='success'?'#10b981':'#ef4444',color:'white',fontWeight:700,fontSize:'0.85rem',textAlign:'center'}}>{msg.text}</div>}

      {/* Weekly challenge banner */}
      {tab === 'daily' && weeklyChallenge && (
        <div style={{margin:'0.5rem 0.75rem',padding:'0.6rem',background:'linear-gradient(135deg,#78350f,#451a03)',border:'2px solid #f59e0b',borderRadius:'0.5rem'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:'0.65rem',color:'#f59e0b',fontWeight:700,marginBottom:'0.1rem'}}>⚡ WEEKLY CHALLENGE</div>
              <div style={{fontSize:'0.82rem',fontWeight:700,color:'#fef3c7'}}>{weeklyChallenge.title}</div>
              <div style={{fontSize:'0.68rem',color:'#d97706'}}>⭐{weeklyChallenge.xpReward} 💰{weeklyChallenge.currencyReward} 🏛️+1 Legacy Stone</div>
            </div>
            <button onClick={()=>setSelected(selected?.taskId===weeklyChallenge.taskId?null:weeklyChallenge)}
              style={{...S.btn,background:'#f59e0b',color:'#1a1208',fontSize:'0.75rem',flexShrink:0}}>
              View
            </button>
          </div>
        </div>
      )}

      {/* Category filters for browse tab */}
      {tab === 'browse' && (
        <div style={{display:'flex',gap:'0.25rem',padding:'0.4rem 0.75rem',overflowX:'auto',flexShrink:0,background:'#0a0f1a',borderBottom:'1px solid #1e293b'}}>
          <button onClick={()=>{setFilter('All');loadTab('browse');}} style={{...S.btn,background:filter==='All'?'#0ea5e9':'#1e293b',color:'white',whiteSpace:'nowrap',fontSize:'0.7rem'}}>🌍 All</button>
          {domains.map((d,i)=>(
            <button key={d.name} onClick={()=>{setFilter(d.name);axios.get(`/api/gen-tasks/domain/${encodeURIComponent(d.name)}?count=20`).then(r=>setTasks(r.data||[]));}}
              style={{...S.btn,background:filter===d.name?CC[i%CC.length]:'#1e293b',color:'white',whiteSpace:'nowrap',fontSize:'0.7rem'}}>
              {d.icon} {d.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      <div style={S.body}>
        {loading ? <div style={{textAlign:'center',padding:'2rem',color:'#64748b'}}>⏳ Loading tasks...</div> :
          filtered.length === 0 ? <div style={{textAlign:'center',padding:'2rem',color:'#64748b'}}>📭 No tasks found</div> :
          filtered.map((t, idx) => (
            <div key={t.taskId || idx} style={{...S.card, borderLeft:`3px solid ${CC[idx%CC.length]}`,
              background:selected?.taskId===t.taskId?'#1e293b':'#0f172a'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'0.5rem'}}>
                <div style={{flex:1,cursor:'pointer'}} onClick={()=>{setSelected(selected?.taskId===t.taskId?null:t);if(!timerStart[t.taskId])startTimer(t.taskId);}}>
                  <div style={{fontWeight:700,fontSize:'0.88rem',color:'#e2e8f0',marginBottom:'0.15rem'}}>{t.title}</div>
                  <div style={{display:'flex',gap:'0.4rem',fontSize:'0.72rem',flexWrap:'wrap',alignItems:'center'}}>
                    <span style={{color:'#fbbf24'}}>⭐{t.xpReward}</span>
                    <span style={{color:'#10b981'}}>💰{t.currencyReward}</span>
                    {t.tier && <span style={{color:TIER_COLORS[t.tier]||'#64748b',background:'#1e293b',padding:'0.05rem 0.3rem',borderRadius:'1rem',fontSize:'0.6rem',fontWeight:700}}>{t.tier}</span>}
                    {t.isDaily && <span style={{color:'#ec4899',fontSize:'0.6rem',fontWeight:700}}>📅 Daily</span>}
                    {t.streakBonus && <span style={{color:'#f59e0b',fontSize:'0.6rem'}}>🔥 Streak</span>}
                    <span style={{color:'#64748b',fontSize:'0.6rem'}}>{t.category}</span>
                  </div>
                </div>
                <button onClick={(e)=>{e.stopPropagation();complete(t);}} disabled={completing===t.taskId}
                  style={{padding:'0.45rem 0.8rem',background:completing===t.taskId?'#374151':'#10b981',color:'white',
                    border:'none',borderRadius:'0.4rem',fontWeight:700,cursor:completing===t.taskId?'wait':'pointer',
                    fontSize:'0.82rem',flexShrink:0,minWidth:80}}>
                  {completing===t.taskId ? '⏳' : '✅ Do'}
                </button>
              </div>
              {selected?.taskId===t.taskId && (
                <div style={{marginTop:'0.5rem',paddingTop:'0.5rem',borderTop:'1px solid #1e293b'}}>
                  <div style={{fontSize:'0.8rem',color:'#94a3b8',lineHeight:1.5,marginBottom:'0.4rem'}}>{t.description}</div>
                  {t.realReward && t.realReward !== 'None' && (
                    <div style={{fontSize:'0.78rem',color:'#ec4899',padding:'0.3rem 0.5rem',background:'#831843',borderRadius:'0.3rem',marginBottom:'0.3rem'}}>🎁 {t.realReward}</div>
                  )}
                  {t.isDaily && t.dailyBonus && (
                    <div style={{fontSize:'0.72rem',color:'#ec4899',marginBottom:'0.3rem'}}>
                      📅 Complete all 3 daily quests for bonus: +{t.dailyBonus.xp}XP +{t.dailyBonus.currency}💰
                    </div>
                  )}
                  {/* AI Proof Submission */}
                  <div style={{background:'#0a0f1a',borderRadius:'0.4rem',padding:'0.5rem',marginTop:'0.3rem'}}>
                    <div style={{fontSize:'0.72rem',color:'#94a3b8',marginBottom:'0.3rem',fontWeight:700}}>
                      🤖 AI Verification — describe what you did for bonus XP
                    </div>
                    <textarea value={showProof===t.taskId?proofText:''} onChange={e=>{setShowProof(t.taskId);setProofText(e.target.value);}}
                      placeholder="What did you do? What did you learn? Any specific results or numbers?"
                      style={{width:'100%',padding:'0.4rem',background:'#1e293b',border:'1px solid #334155',borderRadius:'0.3rem',color:'#e2e8f0',fontSize:'0.8rem',resize:'vertical',minHeight:'60px',boxSizing:'border-box',fontFamily:'inherit'}} />
                    <div style={{display:'flex',gap:'0.4rem',marginTop:'0.3rem'}}>
                      <button onClick={(e)=>{e.stopPropagation();complete(t,true);}} disabled={completing===t.taskId||!proofText.trim()}
                        style={{flex:1,padding:'0.4rem',background:proofText.trim()?'#6366f1':'#374151',color:'white',border:'none',borderRadius:'0.3rem',fontWeight:700,cursor:proofText.trim()?'pointer':'not-allowed',fontSize:'0.78rem'}}>
                        🤖 Verify & Complete (+bonus)
                      </button>
                      <button onClick={(e)=>{e.stopPropagation();complete(t,false);}} disabled={completing===t.taskId}
                        style={{padding:'0.4rem 0.6rem',background:'#10b981',color:'white',border:'none',borderRadius:'0.3rem',fontWeight:700,cursor:'pointer',fontSize:'0.78rem'}}>
                        Quick ✅
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

// === SOCIAL HUB PANEL (chat + friends + gifts + challenges + loot) ===
export function SocialPanel({ onClose }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('chat');
  const [chats, setChats] = useState([]);
  const [chatMsg, setChatMsg] = useState('');
  const [friends, setFriends] = useState({ friends: [], pendingRequests: [] });
  const [friendEmail, setFriendEmail] = useState('');
  const [gifts, setGifts] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [lootResult, setLootResult] = useState(null);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/social/chat').catch(() => ({ data: [] })),
      axios.get('/api/social/friends').catch(() => ({ data: { friends: [], pendingRequests: [] } })),
      axios.get('/api/social/gifts').catch(() => ({ data: [] })),
      axios.get('/api/social/challenges').catch(() => ({ data: [] })),
      axios.get('/api/social/feed').catch(() => ({ data: [] })),
    ]).then(([c, f, g, ch, fe]) => {
      setChats(c.data || []); setFriends(f.data); setGifts(g.data || []); setChallenges(ch.data || []); setFeed(fe.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const sendMessage = async () => {
    if (!chatMsg.trim()) return;
    try { await axios.post('/api/social/chat', { message: chatMsg }); setChatMsg(''); const r = await axios.get('/api/social/chat'); setChats(r.data || []); } catch (e) { }
  };

  const addFriend = async () => {
    if (!friendEmail.trim()) return;
    try { await axios.post('/api/social/friends', { email: friendEmail }); setFriendEmail(''); alert('Request sent!'); } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const claimGift = async (id) => {
    try { const r = await axios.post(`/api/social/gifts/${id}/claim`); alert(r.data.message); setGifts(prev => prev.filter(g => g._id !== id)); } catch (e) { alert('Failed'); }
  };

  const openLootBox = async () => {
    try { const r = await axios.post('/api/social/loot-box'); setLootResult(r.data); setTimeout(() => setLootResult(null), 4000); } catch (e) { alert(e.response?.data?.error || 'Need 100 credits'); }
  };

  const RARITY_COLORS = { common:'#94a3b8', uncommon:'#10b981', rare:'#3b82f6', epic:'#8b5cf6', legendary:'#f59e0b' };
  const tabs = [['chat','💬'],['friends','👥'],['gifts','🎁'],['challenges','⚔️'],['feed','📰'],['loot','🎰']];

  return (
    <div style={S.overlay}>
      <div style={{...S.header, background:'linear-gradient(90deg,#134e4a,#0f172a)'}}>
        <h2 style={S.title}>🌐 Social</h2>
        <button style={S.close} onClick={onClose}>✕</button>
      </div>
      <div style={{display:'flex',gap:'0.2rem',padding:'0.3rem',background:'#0a0f1a',borderBottom:'1px solid #1e293b'}}>
        {tabs.map(([id,icon])=><button key={id} onClick={()=>setTab(id)} style={{...S.btn,flex:1,background:tab===id?'#14b8a6':'#1e293b',color:'white',fontSize:'0.9rem',padding:'0.35rem'}}>{icon}</button>)}
      </div>

      {/* Loot result overlay */}
      {lootResult && (
        <div style={{padding:'0.75rem',background:RARITY_COLORS[lootResult.reward?.rarity]||'#1e293b',color:'white',textAlign:'center',fontWeight:700,fontSize:'1rem',animation:'pulse 0.5s'}}>
          🎰 {lootResult.reward?.rarity?.toUpperCase()} — +{lootResult.reward?.amount} {lootResult.reward?.type}!
        </div>
      )}

      <div style={S.body}>
        {loading ? <div style={{textAlign:'center',padding:'2rem',color:'#64748b'}}>Loading...</div> :

        tab === 'chat' ? <>
          <div style={{display:'flex',flexDirection:'column',gap:'0.3rem',marginBottom:'0.5rem',maxHeight:'50vh',overflowY:'auto'}}>
            {chats.length === 0 ? <div style={{color:'#475569',textAlign:'center',padding:'1rem'}}>No messages yet. Say hi!</div> :
              chats.map((c,i) => (
                <div key={i} style={{...S.card, borderLeft:`2px solid ${c.senderId?.email === user?.email ? '#6366f1' : '#334155'}`}}>
                  <div style={{fontSize:'0.7rem',color:'#64748b',marginBottom:'0.15rem'}}>{c.senderId?.email || 'Unknown'} · Rank {c.senderId?.rank || 1}</div>
                  <div style={{fontSize:'0.85rem'}}>{c.message}</div>
                </div>
              ))}
          </div>
          <div style={{display:'flex',gap:'0.3rem'}}>
            <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMessage()} placeholder="Type a message..."
              style={{flex:1,padding:'0.4rem',background:'#1e293b',border:'1px solid #334155',borderRadius:'0.3rem',color:'#e2e8f0',fontSize:'0.85rem'}} />
            <button onClick={sendMessage} style={{...S.btn,background:'#14b8a6',color:'white'}}>Send</button>
          </div>
        </> :

        tab === 'friends' ? <>
          <div style={{display:'flex',gap:'0.3rem',marginBottom:'0.75rem'}}>
            <input value={friendEmail} onChange={e=>setFriendEmail(e.target.value)} placeholder="Friend's email..."
              style={{flex:1,padding:'0.4rem',background:'#1e293b',border:'1px solid #334155',borderRadius:'0.3rem',color:'#e2e8f0',fontSize:'0.85rem'}} />
            <button onClick={addFriend} style={{...S.btn,background:'#6366f1',color:'white'}}>Add</button>
          </div>
          {friends.pendingRequests?.length > 0 && <>
            <div style={{fontSize:'0.75rem',color:'#f59e0b',fontWeight:700,marginBottom:'0.3rem'}}>Pending Requests</div>
            {friends.pendingRequests.map(r => (
              <div key={r._id} style={{...S.card,...S.row}}>
                <span>{r.userId?.email}</span>
                <button onClick={async()=>{await axios.post(`/api/social/friends/${r._id}/accept`);alert('Accepted!');}} style={{...S.btn,background:'#10b981',color:'white'}}>Accept</button>
              </div>
            ))}
          </>}
          <div style={{fontSize:'0.75rem',color:'#94a3b8',fontWeight:700,marginBottom:'0.3rem'}}>Friends ({friends.friends?.length || 0})</div>
          {(friends.friends || []).map(f => (
            <div key={f._id} style={{...S.card,...S.row}}>
              <span>{f.email} <span style={{color:'#6366f1'}}>Lv.{f.rank}</span></span>
              <span style={{color:'#10b981',fontSize:'0.75rem'}}>⭐{f.xp} 🔥{f.streak||0}</span>
            </div>
          ))}
        </> :

        tab === 'gifts' ? <>
          <div style={{fontSize:'0.75rem',color:'#94a3b8',marginBottom:'0.5rem'}}>Unclaimed gifts from friends</div>
          {gifts.length === 0 ? <div style={{color:'#475569',textAlign:'center',padding:'1rem'}}>No gifts</div> :
            gifts.map(g => (
              <div key={g._id} style={{...S.card,...S.row}}>
                <span>🎁 {g.amount} {g.type} from {g.senderId?.email || 'someone'}</span>
                <button onClick={()=>claimGift(g._id)} style={{...S.btn,background:'#10b981',color:'white'}}>Claim</button>
              </div>
            ))}
        </> :

        tab === 'challenges' ? <>
          <div style={{fontSize:'0.75rem',color:'#94a3b8',marginBottom:'0.5rem'}}>Active challenges</div>
          {challenges.length === 0 ? <div style={{color:'#475569',textAlign:'center',padding:'1rem'}}>No active challenges</div> :
            challenges.map(c => (
              <div key={c._id} style={S.card}>
                <div style={S.row}><span>⚔️ {c.type}: {c.goal}</span><span style={{color:'#f59e0b'}}>Wager: {c.wager}💰</span></div>
                <div style={{fontSize:'0.72rem',color:'#64748b',marginTop:'0.2rem'}}>
                  {c.challengerId?.email} vs {c.targetId?.email} · {c.status}
                </div>
              </div>
            ))}
        </> :

        tab === 'feed' ? <>
          {feed.length === 0 ? <div style={{color:'#475569',textAlign:'center',padding:'1rem'}}>No activity yet</div> :
            feed.slice(0, 30).map((a,i) => (
              <div key={i} style={{...S.card, fontSize:'0.8rem'}}>
                <span style={{color:'#64748b',fontSize:'0.68rem'}}>{a.userId?.email || 'Player'}</span>
                <div>{a.message}</div>
              </div>
            ))}
        </> :

        tab === 'loot' ? <>
          <div style={{textAlign:'center',padding:'1rem'}}>
            <div style={{fontSize:'3rem',marginBottom:'0.5rem'}}>🎰</div>
            <h3 style={{marginBottom:'0.3rem'}}>Mystery Loot Box</h3>
            <p style={{color:'#64748b',fontSize:'0.8rem',marginBottom:'1rem'}}>Cost: 100💰 · Rewards range from common to legendary</p>
            <button onClick={openLootBox} style={{padding:'0.6rem 1.5rem',background:'linear-gradient(135deg,#f59e0b,#ef4444)',color:'white',border:'none',borderRadius:'0.5rem',fontWeight:700,fontSize:'1rem',cursor:'pointer',boxShadow:'0 0 20px rgba(245,158,11,0.3)'}}>
              🎰 Open Box (100💰)
            </button>
            <div style={{marginTop:'1rem',fontSize:'0.7rem',color:'#475569'}}>
              <div>Common (55%): 50-200 credits or XP</div>
              <div>Uncommon (15%): Energy or 200-500 credits</div>
              <div>Rare (12%): Influence or Innovation tokens</div>
              <div>Epic (3%): 500-1000 credits</div>
              <div>Legendary (1%): Legacy Stones</div>
            </div>
          </div>
        </> : null}
      </div>
    </div>
  );
}

// === JOBS PANEL — Interactive Living Job System ===
export function JobsPanel({ onClose }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('my');
  const [families, setFamilies] = useState([]);
  const [myJob, setMyJob] = useState(null);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [activeMissions, setActiveMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fam, status, missions] = await Promise.all([
        axios.get('/api/jobs/families').catch(() => ({ data: [] })),
        axios.get('/api/gameplay/status').catch(() => ({ data: null })),
        axios.get('/api/gen-tasks/daily').catch(() => ({ data: [] })),
      ]);
      setFamilies(fam.data || []);
      if (status.data?.currentJob) setMyJob(status.data.currentJob);
      setActiveMissions((missions.data || []).slice(0, 3).map((t, i) => ({
        ...t, missionId: 'mission-' + i,
        steps: [
          { step: 1, desc: 'Accept the mission', done: true },
          { step: 2, desc: t.title?.substring(0, 50) || 'Complete the task', done: false },
          { step: 3, desc: 'Submit proof of completion', done: false },
        ],
        collaborative: i === 2, timeLimit: '24h',
      })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadFamily = async (fam) => {
    setSelectedFamily(fam); setTab('browse');
    try { const r = await axios.get('/api/jobs/family/' + fam.id); setJobs(r.data || []); }
    catch (e) { setJobs([]); }
  };

  const unlock = async (job) => {
    try {
      const r = await axios.post('/api/jobs/unlock/' + job.familyId + '/' + job.tier + '/' + (job.spec || 0));
      setMsg({ text: r.data.message, type: 'success' }); setMyJob(job);
      setTimeout(() => setMsg(null), 3000);
    } catch (e) { setMsg({ text: e.response?.data?.error || 'Failed', type: 'error' }); setTimeout(() => setMsg(null), 3000); }
  };

  const completeMission = async (mission) => {
    try {
      const r = await axios.post(`/api/gen-tasks/complete/${mission.taskId}`, {
        xpReward: mission.xpReward, currencyReward: mission.currencyReward,
        category: mission.category, title: mission.title, tier: mission.tier
      });
      setMsg({ text: `✅ +${r.data.rewards.xp}XP +${r.data.rewards.currency}💰`, type: 'success' });
      setActiveMissions(prev => prev.filter(m => m.missionId !== mission.missionId));
      setTimeout(() => setMsg(null), 3000);
    } catch (e) { setMsg({ text: e.response?.data?.error || 'Failed', type: 'error' }); setTimeout(() => setMsg(null), 3000); }
  };

  const JC = { developer:'#3b82f6',farmer:'#22c55e',teacher:'#8b5cf6',engineer:'#f59e0b',medic:'#ef4444',creator:'#ec4899',investor:'#14b8a6',scientist:'#6366f1',leader:'#d97706',builder:'#78716c',trader:'#0ea5e9',warrior:'#dc2626',explorer:'#059669',healer:'#10b981',craftsman:'#a16207',communicator:'#7c3aed',athlete:'#ea580c',chef:'#b91c1c',pilot:'#0284c7',philosopher:'#4f46e5' };

  return (
    <div style={S.overlay}>
      <div style={{...S.header, background:'linear-gradient(90deg,#3a1a0a,#1a1208)'}}>
        <h2 style={S.title}>⚔️ Job Hall</h2>
        <button style={S.close} onClick={onClose}>✕</button>
      </div>
      <div style={{display:'flex',gap:'0.2rem',padding:'0.3rem',background:'#0a0804',borderBottom:'1px solid #5c4a2a'}}>
        {[['my','👤 My Role'],['missions','📋 Missions'],['browse','🏛️ Browse'],['guild','⚔️ Guild']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{...S.btn,flex:1,background:tab===id?'#5c4a2a':'#1a1208',color:tab===id?'#c9a84c':'#a08c6a',fontSize:'0.68rem',padding:'0.3rem',border:tab===id?'1px solid #c9a84c':'1px solid #3a2a1a'}}>{label}</button>
        ))}
      </div>
      {msg && <div style={{padding:'0.4rem 1rem',background:msg.type==='success'?'#2a6a2a':'#6a2a2a',color:'#f5e6c8',fontWeight:700,fontSize:'0.85rem',textAlign:'center'}}>{msg.text}</div>}
      <div style={S.body}>
        {loading ? <div style={{textAlign:'center',padding:'2rem',color:'#a08c6a'}}>Loading...</div> :

        tab==='my' ? (
          myJob ? (
            <>
              <div style={{...S.card,borderLeft:`4px solid ${JC[myJob.familyId]||'#c9a84c'}`,marginBottom:'0.75rem'}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.5rem'}}>
                  <div style={{fontSize:'2.5rem'}}>{myJob.familyIcon||'⚔️'}</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:'1rem',color:'#f5e6c8'}}>{myJob.name}</div>
                    <div style={{fontSize:'0.7rem',color:'#a08c6a'}}>{myJob.familyName} · Tier {(myJob.tier||0)+1} · {myJob.specName}</div>
                    <div style={{fontSize:'0.65rem',color:JC[myJob.familyId]||'#c9a84c',marginTop:'0.1rem'}}>Next: {myJob.evolutionPath||'MAX TIER'}</div>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.3rem',marginBottom:'0.5rem'}}>
                  {[['⚔️',myJob.stats?.atk,'ATK'],['🛡️',myJob.stats?.def,'DEF'],['❤️',myJob.stats?.hp,'HP'],['💨',myJob.stats?.spd,'SPD']].map(([icon,val,label])=>(
                    <div key={label} style={{background:'#1a1208',borderRadius:'0.25rem',padding:'0.3rem',textAlign:'center'}}>
                      <div style={{fontSize:'0.9rem'}}>{icon}</div>
                      <div style={{fontWeight:700,fontSize:'0.8rem',color:'#f5e6c8'}}>{val||0}</div>
                      <div style={{fontSize:'0.55rem',color:'#a08c6a'}}>{label}</div>
                    </div>
                  ))}
                </div>
                {myJob.abilities?.length > 0 && (
                  <div>
                    <div style={{fontSize:'0.65rem',color:'#a08c6a',marginBottom:'0.2rem'}}>ABILITIES</div>
                    <div style={{display:'flex',gap:'0.25rem',flexWrap:'wrap'}}>
                      {myJob.abilities.map((a,i)=>(
                        <div key={i} style={{padding:'0.2rem 0.4rem',background:(JC[myJob.familyId]||'#c9a84c')+'20',border:`1px solid ${JC[myJob.familyId]||'#c9a84c'}40`,borderRadius:'0.25rem',fontSize:'0.65rem',color:JC[myJob.familyId]||'#c9a84c'}}>
                          {a.name} <span style={{color:'#a08c6a'}}>({a.power})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{...S.card,marginBottom:'0.5rem'}}>
                <div style={{fontSize:'0.7rem',color:'#c9a84c',fontWeight:700,marginBottom:'0.4rem'}}>📈 SKILL PROGRESSION</div>
                {['Combat','Crafting','Leadership','Knowledge'].map((skill,i)=>{
                  const pct=20+i*15;
                  return (
                    <div key={skill} style={{marginBottom:'0.3rem'}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.65rem',color:'#a08c6a',marginBottom:'0.1rem'}}><span>{skill}</span><span>{pct}%</span></div>
                      <div style={{height:4,background:'#1a1208',borderRadius:2,overflow:'hidden'}}>
                        <div style={{height:'100%',width:pct+'%',background:JC[myJob.familyId]||'#c9a84c',borderRadius:2}} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={()=>setTab('browse')} style={{...S.btn,width:'100%',background:'#2a1f10',color:'#c9a84c',textAlign:'center'}}>🔄 Change Job</button>
            </>
          ) : (
            <div style={{textAlign:'center',padding:'2rem'}}>
              <div style={{fontSize:'3rem',marginBottom:'0.5rem'}}>⚔️</div>
              <div style={{color:'#c9a84c',fontWeight:700,marginBottom:'0.3rem'}}>No Job Selected</div>
              <div style={{color:'#a08c6a',fontSize:'0.8rem',marginBottom:'1rem'}}>Choose a job to unlock abilities, skill trees, and exclusive missions</div>
              <button onClick={()=>setTab('browse')} style={{...S.btn,background:'#c9a84c',color:'#1a1208',padding:'0.6rem 1.5rem'}}>Browse Jobs</button>
            </div>
          )
        ) :

        tab==='missions' ? (
          <div>
            <div style={{fontSize:'0.72rem',color:'#a08c6a',marginBottom:'0.75rem',padding:'0.4rem',background:'#1a1208',borderRadius:'0.3rem'}}>
              🎯 Active job missions reset daily. Complete them for bonus rewards.
            </div>
            {activeMissions.length===0 ? (
              <div style={{textAlign:'center',padding:'2rem',color:'#a08c6a'}}>📭 No active missions. Check back tomorrow!</div>
            ) : activeMissions.map((mission,idx)=>(
              <div key={mission.missionId} style={{...S.card,borderLeft:`3px solid ${idx===0?'#10b981':idx===1?'#3b82f6':'#f59e0b'}`,marginBottom:'0.5rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.4rem'}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:'0.88rem',color:'#f5e6c8',marginBottom:'0.15rem'}}>{mission.title}</div>
                    <div style={{display:'flex',gap:'0.4rem',fontSize:'0.7rem',flexWrap:'wrap'}}>
                      <span style={{color:'#fbbf24'}}>⭐{mission.xpReward}</span>
                      <span style={{color:'#10b981'}}>💰{mission.currencyReward}</span>
                      <span style={{color:'#64748b'}}>⏱ {mission.timeLimit}</span>
                      {mission.collaborative&&<span style={{color:'#8b5cf6',fontWeight:700}}>👥 Co-op</span>}
                    </div>
                  </div>
                  <button onClick={()=>completeMission(mission)} style={{...S.btn,background:idx===0?'#10b981':idx===1?'#3b82f6':'#f59e0b',color:'#1a1208',fontSize:'0.75rem',flexShrink:0}}>Complete</button>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'0.2rem'}}>
                  {mission.steps.map(step=>(
                    <div key={step.step} style={{display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.68rem',color:step.done?'#10b981':'#a08c6a'}}>
                      <span>{step.done?'✅':'○'}</span>
                      <span style={{textDecoration:step.done?'line-through':'none'}}>{step.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{...S.card,borderLeft:'3px solid #8b5cf6',background:'#1a0a2a'}}>
              <div style={{fontSize:'0.65rem',color:'#8b5cf6',fontWeight:700,marginBottom:'0.2rem'}}>⚡ GUILD MISSION — Requires 3+ players</div>
              <div style={{fontWeight:700,fontSize:'0.85rem',color:'#f5e6c8',marginBottom:'0.2rem'}}>Collective Knowledge Drive</div>
              <div style={{fontSize:'0.7rem',color:'#a08c6a',marginBottom:'0.4rem'}}>Your guild must collectively complete 50 tasks today</div>
              <div style={{height:6,background:'#1a1208',borderRadius:3,overflow:'hidden',marginBottom:'0.3rem'}}>
                <div style={{height:'100%',width:'34%',background:'#8b5cf6',borderRadius:3}} />
              </div>
              <div style={{fontSize:'0.65rem',color:'#8b5cf6'}}>17/50 completed · Reward: 500XP + 250💰 each</div>
            </div>
          </div>
        ) :

        tab==='browse' ? (
          !selectedFamily ? (
            <>
              <p style={{color:'#a08c6a',fontSize:'0.75rem',marginBottom:'0.75rem'}}>20 families · 6 tiers · 10 specs = 1,200 unique roles</p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:'0.4rem'}}>
                {families.map(f=>(
                  <div key={f.id} onClick={()=>loadFamily(f)} style={{...S.card,cursor:'pointer',textAlign:'center',borderColor:(JC[f.id]||f.color||'#c9a84c')+'60'}}>
                    <div style={{fontSize:'1.8rem',marginBottom:'0.2rem'}}>{f.icon}</div>
                    <div style={{fontWeight:700,fontSize:'0.78rem',color:JC[f.id]||f.color||'#c9a84c'}}>{f.name}</div>
                    <div style={{fontSize:'0.58rem',color:'#a08c6a',marginTop:'0.1rem'}}>{f.desc?.substring(0,30)}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <button onClick={()=>setSelectedFamily(null)} style={{...S.btn,background:'#2a1f10',color:'#a08c6a',marginBottom:'0.5rem'}}>← All Jobs</button>
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.5rem'}}>
                <span style={{fontSize:'1.5rem'}}>{selectedFamily.icon}</span>
                <div>
                  <div style={{fontWeight:700,color:JC[selectedFamily.id]||'#c9a84c'}}>{selectedFamily.name}</div>
                  <div style={{fontSize:'0.65rem',color:'#a08c6a'}}>{selectedFamily.desc}</div>
                </div>
              </div>
              <div style={{display:'flex',gap:'0.2rem',marginBottom:'0.75rem',overflowX:'auto'}}>
                {(selectedFamily.tiers||[]).map((tier,i)=>(
                  <div key={i} style={{flex:1,minWidth:60,padding:'0.3rem',background:'#1a1208',border:`1px solid ${JC[selectedFamily.id]||'#c9a84c'}40`,borderRadius:'0.25rem',textAlign:'center'}}>
                    <div style={{fontSize:'0.55rem',color:'#a08c6a'}}>T{i+1}</div>
                    <div style={{fontSize:'0.62rem',fontWeight:700,color:JC[selectedFamily.id]||'#c9a84c'}}>{tier}</div>
                  </div>
                ))}
              </div>
              {jobs.slice(0,20).map(j=>(
                <div key={j.jobId} style={{...S.card,borderLeft:`3px solid ${JC[selectedFamily.id]||'#c9a84c'}`,marginBottom:'0.4rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:'#f5e6c8',fontSize:'0.85rem'}}>{j.name}</div>
                      <div style={{fontSize:'0.62rem',color:'#a08c6a'}}>Tier {(j.tier||0)+1} · {j.specName}</div>
                      <div style={{display:'flex',gap:'0.3rem',fontSize:'0.6rem',color:'#5c4a2a',marginTop:'0.1rem'}}>
                        <span>⚔️{j.stats?.atk}</span><span>🛡️{j.stats?.def}</span><span>❤️{j.stats?.hp}</span>
                      </div>
                    </div>
                    <button onClick={()=>unlock(j)} style={{...S.btn,background:j.unlockCost===0?'#10b981':JC[selectedFamily.id]||'#c9a84c',color:'#1a1208',fontSize:'0.7rem',flexShrink:0}}>
                      {j.unlockCost===0?'Free':`💰${j.unlockCost}`}
                    </button>
                  </div>
                  {j.abilities?.slice(0,3).map((a,i)=>(
                    <span key={i} style={{display:'inline-block',marginRight:'0.2rem',marginTop:'0.2rem',fontSize:'0.55rem',padding:'0.1rem 0.25rem',background:(JC[selectedFamily.id]||'#c9a84c')+'15',color:JC[selectedFamily.id]||'#c9a84c',borderRadius:'0.15rem'}}>{a.name}</span>
                  ))}
                </div>
              ))}
            </>
          )
        ) :

        tab==='guild' ? (
          <div>
            <div style={{...S.card,borderLeft:'3px solid #f59e0b',marginBottom:'0.75rem'}}>
              <div style={{fontSize:'0.65rem',color:'#f59e0b',fontWeight:700,marginBottom:'0.2rem'}}>⚔️ YOUR GUILD</div>
              <div style={{fontWeight:700,fontSize:'1rem',color:'#f5e6c8',marginBottom:'0.3rem'}}>Frontier Builders</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.3rem',marginBottom:'0.4rem'}}>
                {[['Members','12'],['Rank','#47'],['Power','8,420']].map(([l,v])=>(
                  <div key={l} style={{background:'#1a1208',padding:'0.3rem',borderRadius:'0.25rem',textAlign:'center'}}>
                    <div style={{fontSize:'0.55rem',color:'#a08c6a'}}>{l}</div>
                    <div style={{fontWeight:700,color:'#f5e6c8',fontSize:'0.85rem'}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{fontSize:'0.7rem',color:'#c9a84c',fontWeight:700,marginBottom:'0.4rem'}}>🎯 GUILD OBJECTIVES</div>
            {[['Complete 100 tasks this week',67,'500XP each'],['Reach guild rank #40',40,'1000💰 each'],['Build 5 structures collectively',60,'Legacy Stone']].map(([name,pct,reward],i)=>(
              <div key={i} style={{...S.card,marginBottom:'0.4rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.75rem',marginBottom:'0.2rem'}}>
                  <span style={{color:'#f5e6c8'}}>{name}</span>
                  <span style={{color:'#f59e0b',fontSize:'0.65rem'}}>{reward}</span>
                </div>
                <div style={{height:5,background:'#1a1208',borderRadius:3,overflow:'hidden',marginBottom:'0.15rem'}}>
                  <div style={{height:'100%',width:pct+'%',background:'#f59e0b',borderRadius:3}} />
                </div>
                <div style={{fontSize:'0.6rem',color:'#a08c6a'}}>{pct}% complete</div>
              </div>
            ))}
            <div style={{fontSize:'0.7rem',color:'#c9a84c',fontWeight:700,marginBottom:'0.4rem',marginTop:'0.5rem'}}>👥 MEMBERS ONLINE</div>
            {['Explorer_7','Builder_X','Scholar_3','Warrior_9'].map((name,i)=>(
              <div key={i} style={{...S.card,...S.row,marginBottom:'0.3rem'}}>
                <span style={{fontSize:'0.8rem'}}>🟢 {name}</span>
                <span style={{fontSize:'0.65rem',color:'#a08c6a'}}>Lv.{5+i*3} · {['Exploring','Building','Researching','Fighting'][i]}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// === TACTICS BATTLE PANEL (turn-based grid combat) ===
export function TacticsPanel({ onClose }) {
  const [battle, setBattle] = useState(null);
  const [grid, setGrid] = useState([]);
  const [units, setUnits] = useState([]);
  const [turn, setTurn] = useState(0);
  const [selected, setSelected] = useState(null);
  const [log, setLog] = useState([]);
  const [phase, setPhase] = useState('setup'); // setup | player | enemy | victory | defeat
  const GW = 8, GH = 6;

  const addLog = (msg) => setLog(prev => [...prev.slice(-8), msg]);

  const startBattle = () => {
    // Generate grid
    const g = Array.from({length:GH}, () => Array.from({length:GW}, () => ({ terrain: Math.random() > 0.8 ? 'rock' : Math.random() > 0.9 ? 'water' : 'grass' })));
    setGrid(g);
    // Player units
    const playerUnits = [
      { id:'p1', name:'Knight', icon:'⚔️', team:'player', x:0, y:1, hp:120, maxHp:120, atk:25, def:12, spd:5, abilities:[{name:'Slash',power:30,range:1},{name:'Shield Bash',power:20,range:1}], moved:false, acted:false },
      { id:'p2', name:'Mage', icon:'🔮', team:'player', x:0, y:3, hp:80, maxHp:80, atk:35, def:5, spd:7, abilities:[{name:'Fireball',power:40,range:3},{name:'Ice Shard',power:25,range:2}], moved:false, acted:false },
      { id:'p3', name:'Archer', icon:'🏹', team:'player', x:1, y:2, hp:90, maxHp:90, atk:28, def:8, spd:8, abilities:[{name:'Arrow',power:25,range:4},{name:'Volley',power:35,range:3}], moved:false, acted:false },
    ];
    // Enemy units
    const enemyUnits = [
      { id:'e1', name:'Goblin', icon:'👹', team:'enemy', x:7, y:1, hp:60, maxHp:60, atk:15, def:5, spd:6, abilities:[{name:'Stab',power:18,range:1}], moved:false, acted:false },
      { id:'e2', name:'Orc', icon:'👾', team:'enemy', x:7, y:3, hp:100, maxHp:100, atk:22, def:10, spd:4, abilities:[{name:'Smash',power:28,range:1}], moved:false, acted:false },
      { id:'e3', name:'Dark Mage', icon:'🧙', team:'enemy', x:6, y:2, hp:70, maxHp:70, atk:30, def:4, spd:5, abilities:[{name:'Dark Bolt',power:35,range:3}], moved:false, acted:false },
    ];
    setUnits([...playerUnits, ...enemyUnits]);
    setBattle(true);
    setPhase('player');
    setTurn(1);
    addLog('⚔️ Battle Start! Select a unit to move.');
  };

  const moveUnit = (unit, tx, ty) => {
    if (unit.moved || unit.team !== 'player' || phase !== 'player') return;
    const dist = Math.abs(unit.x - tx) + Math.abs(unit.y - ty);
    if (dist > 3) { addLog('Too far! Max 3 tiles.'); return; }
    if (grid[ty]?.[tx]?.terrain === 'rock') { addLog('Can\'t move to rock!'); return; }
    if (units.some(u => u.x === tx && u.y === ty && u.hp > 0)) { addLog('Tile occupied!'); return; }
    setUnits(prev => prev.map(u => u.id === unit.id ? { ...u, x: tx, y: ty, moved: true } : u));
    addLog(`${unit.icon} ${unit.name} moved to (${tx},${ty})`);
  };

  const attack = (attacker, target, ability) => {
    if (attacker.acted || attacker.team !== 'player' || phase !== 'player') return;
    const dist = Math.abs(attacker.x - target.x) + Math.abs(attacker.y - target.y);
    if (dist > ability.range) { addLog(`Out of range! Need ${ability.range}, got ${dist}`); return; }
    const dmg = Math.max(1, ability.power + attacker.atk - target.def + Math.floor(Math.random() * 10) - 5);
    setUnits(prev => {
      const next = prev.map(u => {
        if (u.id === target.id) return { ...u, hp: Math.max(0, u.hp - dmg) };
        if (u.id === attacker.id) return { ...u, acted: true };
        return u;
      });
      // Check victory/defeat
      const enemiesAlive = next.filter(u => u.team === 'enemy' && u.hp > 0);
      const playersAlive = next.filter(u => u.team === 'player' && u.hp > 0);
      if (enemiesAlive.length === 0) setTimeout(() => setPhase('victory'), 500);
      if (playersAlive.length === 0) setTimeout(() => setPhase('defeat'), 500);
      return next;
    });
    addLog(`${attacker.icon} ${ability.name} → ${target.icon} ${target.name} for ${dmg} damage!`);
  };

  const endPlayerTurn = () => {
    setPhase('enemy');
    addLog('--- Enemy Turn ---');
    // Simple enemy AI
    setTimeout(() => {
      setUnits(prev => {
        let next = [...prev];
        const enemies = next.filter(u => u.team === 'enemy' && u.hp > 0);
        const players = next.filter(u => u.team === 'player' && u.hp > 0);
        enemies.forEach(enemy => {
          if (players.length === 0) return;
          const target = players[Math.floor(Math.random() * players.length)];
          const dist = Math.abs(enemy.x - target.x) + Math.abs(enemy.y - target.y);
          const ability = enemy.abilities[0];
          if (dist <= ability.range) {
            const dmg = Math.max(1, ability.power + enemy.atk - target.def + Math.floor(Math.random() * 8) - 4);
            next = next.map(u => u.id === target.id ? { ...u, hp: Math.max(0, u.hp - dmg) } : u);
            addLog(`${enemy.icon} ${ability.name} → ${target.icon} for ${dmg}!`);
          } else {
            // Move toward nearest player
            const dx = target.x - enemy.x, dy = target.y - enemy.y;
            const mx = dx !== 0 ? dx / Math.abs(dx) : 0, my = dy !== 0 ? dy / Math.abs(dy) : 0;
            const nx = enemy.x + mx, ny = enemy.y + my;
            if (nx >= 0 && nx < GW && ny >= 0 && ny < GH && !next.some(u => u.x === nx && u.y === ny && u.hp > 0)) {
              next = next.map(u => u.id === enemy.id ? { ...u, x: nx, y: ny } : u);
            }
          }
        });
        const playersAlive = next.filter(u => u.team === 'player' && u.hp > 0);
        if (playersAlive.length === 0) setTimeout(() => setPhase('defeat'), 500);
        return next;
      });
      // Reset for next player turn
      setUnits(prev => prev.map(u => ({ ...u, moved: false, acted: false })));
      setTurn(t => t + 1);
      setPhase('player');
      addLog('--- Your Turn ---');
    }, 1000);
  };

  const TERRAIN_COLORS = { grass:'#1a3a1a', rock:'#3d2b1f', water:'#1e3a5f' };
  const cellSize = Math.min(Math.floor((window.innerWidth - 40) / GW), 50);

  return (
    <div style={S.overlay}>
      <div style={{...S.header, background:'linear-gradient(90deg,#7f1d1d,#0f172a)'}}>
        <h2 style={S.title}>⚔️ Tactics Battle {battle ? `— Turn ${turn}` : ''}</h2>
        <button style={S.close} onClick={onClose}>✕</button>
      </div>
      <div style={S.body}>
        {!battle ? (
          <div style={{textAlign:'center',padding:'2rem'}}>
            <div style={{fontSize:'4rem',marginBottom:'1rem'}}>⚔️</div>
            <h3 style={{marginBottom:'0.5rem'}}>Turn-Based Tactics</h3>
            <p style={{color:'#64748b',fontSize:'0.85rem',marginBottom:'1.5rem'}}>Grid-based combat. Move units, use abilities, defeat enemies.</p>
            <button onClick={startBattle} style={{padding:'0.75rem 2rem',background:'linear-gradient(135deg,#ef4444,#dc2626)',color:'white',border:'none',borderRadius:'0.5rem',fontWeight:700,fontSize:'1rem',cursor:'pointer'}}>
              ⚔️ Start Battle
            </button>
          </div>
        ) : phase === 'victory' ? (
          <div style={{textAlign:'center',padding:'2rem'}}>
            <div style={{fontSize:'4rem',marginBottom:'0.5rem'}}>🏆</div>
            <h3 style={{color:'#fbbf24'}}>Victory!</h3>
            <p style={{color:'#94a3b8',marginBottom:'1rem'}}>All enemies defeated in {turn} turns!</p>
            <button onClick={() => { setBattle(null); setPhase('setup'); setLog([]); }} style={{...S.btn,background:'#10b981',color:'white',padding:'0.6rem 1.5rem'}}>Play Again</button>
          </div>
        ) : phase === 'defeat' ? (
          <div style={{textAlign:'center',padding:'2rem'}}>
            <div style={{fontSize:'4rem',marginBottom:'0.5rem'}}>💀</div>
            <h3 style={{color:'#ef4444'}}>Defeat</h3>
            <button onClick={() => { setBattle(null); setPhase('setup'); setLog([]); }} style={{...S.btn,background:'#6366f1',color:'white',padding:'0.6rem 1.5rem'}}>Try Again</button>
          </div>
        ) : (
          <div>
            {/* Grid */}
            <div style={{display:'grid',gridTemplateColumns:`repeat(${GW},${cellSize}px)`,gap:'1px',marginBottom:'0.5rem',justifyContent:'center'}}>
              {Array.from({length:GH}).map((_,y) => Array.from({length:GW}).map((_,x) => {
                const unit = units.find(u => u.x === x && u.y === y && u.hp > 0);
                const terrain = grid[y]?.[x]?.terrain || 'grass';
                const isSelected = selected?.x === x && selected?.y === y;
                return (
                  <div key={`${x}-${y}`} onClick={() => {
                    if (unit && unit.team === 'player' && !unit.acted) setSelected(unit);
                    else if (selected && !unit) moveUnit(selected, x, y);
                    else if (selected && unit && unit.team === 'enemy') {
                      const ability = selected.abilities[0];
                      attack(selected, unit, ability);
                      setSelected(null);
                    }
                  }}
                    style={{width:cellSize,height:cellSize,background:TERRAIN_COLORS[terrain],border:`1px solid ${isSelected?'#fbbf24':'#1e293b'}`,
                      display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',position:'relative',fontSize:cellSize*0.5+'px',
                      boxShadow:isSelected?'inset 0 0 8px #fbbf24':'none'}}>
                    {unit && <span title={`${unit.name} HP:${unit.hp}/${unit.maxHp}`}>{unit.icon}</span>}
                    {unit && <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:'#1e293b'}}>
                      <div style={{height:'100%',width:`${(unit.hp/unit.maxHp)*100}%`,background:unit.team==='player'?'#22c55e':'#ef4444'}} />
                    </div>}
                  </div>
                );
              }))}
            </div>
            {/* Controls */}
            <div style={{display:'flex',gap:'0.3rem',marginBottom:'0.5rem',flexWrap:'wrap',justifyContent:'center'}}>
              {selected && selected.abilities.map((a,i) => (
                <button key={i} style={{...S.btn,background:'#6366f1',color:'white',fontSize:'0.72rem'}}
                  onClick={() => { const target = units.find(u => u.team === 'enemy' && u.hp > 0); if (target) { attack(selected, target, a); setSelected(null); } }}>
                  {a.name} ({a.power})
                </button>
              ))}
              {phase === 'player' && <button onClick={endPlayerTurn} style={{...S.btn,background:'#f59e0b',color:'#1e1b4b',fontSize:'0.72rem'}}>End Turn →</button>}
            </div>
            {/* Unit status */}
            <div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap',marginBottom:'0.5rem'}}>
              {units.filter(u => u.hp > 0).map(u => (
                <span key={u.id} style={{fontSize:'0.65rem',padding:'0.15rem 0.35rem',background:u.team==='player'?'#1e3a2e':'#3a1e1e',borderRadius:'0.2rem',color:u.team==='player'?'#22c55e':'#ef4444'}}>
                  {u.icon}{u.name} {u.hp}/{u.maxHp}
                </span>
              ))}
            </div>
            {/* Log */}
            <div style={{background:'#0a0f1a',borderRadius:'0.3rem',padding:'0.4rem',maxHeight:'100px',overflowY:'auto'}}>
              {log.map((l,i) => <div key={i} style={{fontSize:'0.68rem',color:'#64748b'}}>{l}</div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// === PROFILE PANEL ===
export function ProfilePanel({ onClose, onLogout }) {
  const { user } = useAuth();
  return (
    <div style={S.overlay}>
      <div style={S.header}><h2 style={S.title}>👤 Profile</h2><button style={S.close} onClick={onClose}>✕</button></div>
      <div style={S.body}>
        <div style={{ textAlign:'center',marginBottom:'1rem' }}>
          <div style={{ width:60,height:60,borderRadius:'50%',background:'#6366f1',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',fontWeight:700,margin:'0 auto 0.5rem' }}>
            {(user?.email || '?')[0].toUpperCase()}
          </div>
          <div style={{ fontWeight:700,fontSize:'1rem' }}>{user?.email}</div>
          <div style={{ color:'#64748b',fontSize:'0.8rem' }}>Level {user?.rank || 1} · {user?.isPremium ? '⭐ Premium' : 'Free'}</div>
        </div>
        <div style={S.grid}>
          <div style={S.card}><div style={S.label}>XP</div><div style={{ fontWeight:700 }}>⭐ {user?.xp || 0}</div></div>
          <div style={S.card}><div style={S.label}>Credits</div><div style={{ fontWeight:700 }}>💰 {user?.currency || 0}</div></div>
          <div style={S.card}><div style={S.label}>Streak</div><div style={{ fontWeight:700 }}>🔥 {user?.streak || 0}d</div></div>
          <div style={S.card}><div style={S.label}>Influence</div><div style={{ fontWeight:700 }}>⚡ {user?.influencePoints || 0}</div></div>
          <div style={S.card}><div style={S.label}>Innovation</div><div style={{ fontWeight:700 }}>🔬 {user?.innovationTokens || 0}</div></div>
          <div style={S.card}><div style={S.label}>Legacy</div><div style={{ fontWeight:700 }}>🏛️ {user?.legacyStones || 0}</div></div>
        </div>
        <button onClick={onLogout} style={{ ...S.btn, background:'#ef4444', color:'white', width:'100%', padding:'0.6rem', marginTop:'0.5rem', fontSize:'0.9rem' }}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}


// === AR EXPLORER PANEL (GPS + Camera in-game) ===
export function ARPanel({ onClose }) {
  const [gps, setGps] = useState(null);
  const [gpsErr, setGpsErr] = useState(null);
  const [objects, setObjects] = useState([]);
  const [collected, setCollected] = useState(new Set());
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) { setGpsErr('GPS not supported'); return; }
    const id = navigator.geolocation.watchPosition(
      pos => { setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: Math.round(pos.coords.accuracy) }); setGpsErr(null); },
      err => setGpsErr(err.message),
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  useEffect(() => {
    if (gps && objects.length === 0) {
      const types = [
        { icon:'💎', name:'Crystal Node', reward:15, xp:20 },
        { icon:'⛽', name:'Fuel Cache', reward:10, xp:10 },
        { icon:'👾', name:'Alien Scout', reward:30, xp:50 },
        { icon:'🌀', name:'Warp Rift', reward:50, xp:100 },
        { icon:'📦', name:'Supply Drop', reward:25, xp:30 },
        { icon:'⛏️', name:'Ore Deposit', reward:20, xp:25 },
        { icon:'✨', name:'Rare Mineral', reward:75, xp:80 },
        { icon:'🛸', name:'Derelict Ship', reward:60, xp:100 },
      ];
      const objs = [];
      for (let i = 0; i < 15; i++) {
        const seed = Math.floor(gps.lat * 10000) + Math.floor(gps.lng * 10000) + i;
        const r = ((seed * 9301 + 49297) % 49831) / 49831;
        const angle = r * Math.PI * 2;
        const dist = 20 + ((seed * 7 + 13) % 280);
        const t = types[i % types.length];
        objs.push({ id: i, ...t, distance: dist, bearing: Math.round(angle * 180 / Math.PI), collected: false });
      }
      setObjects(objs.sort((a, b) => a.distance - b.distance));
    }
  }, [gps]);

  const collect = async (obj) => {
    if (obj.distance > 50) { setMsg('Walk closer! ' + (obj.distance - 50) + 'm to go'); setTimeout(() => setMsg(null), 2000); return; }
    try {
      await axios.post('/api/gen-tasks/complete/ar-' + obj.id, { xpReward: obj.xp, currencyReward: obj.reward, category: 'Space Expansion', title: 'AR: ' + obj.name });
      setCollected(prev => new Set([...prev, obj.id]));
      setMsg(obj.icon + ' +' + obj.reward + ' credits +' + obj.xp + ' XP!');
      setTimeout(() => setMsg(null), 2500);
    } catch (e) { setMsg('Failed'); setTimeout(() => setMsg(null), 2000); }
  };

  return (
    <div style={S.overlay}>
      <div style={{...S.header, background:'linear-gradient(90deg,#1a3a1a,#1a1208)'}}>
        <h2 style={S.title}>🌍 AR Explorer</h2>
        <button style={S.close} onClick={onClose}>✕</button>
      </div>
      {msg && <div style={{padding:'0.4rem',background:'#2a6a2a',color:'#f5e6c8',textAlign:'center',fontWeight:700,fontSize:'0.85rem'}}>{msg}</div>}
      <div style={{padding:'0.4rem 0.75rem',background:'#0a0f0a',borderBottom:'1px solid #2a3a1a',fontSize:'0.7rem'}}>
        {gps ? <span style={{color:'#4aaa4a'}}>📍 GPS Active — {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)} (±{gps.acc}m)</span>
          : gpsErr ? <span style={{color:'#fc8181'}}>❌ {gpsErr}</span>
          : <span style={{color:'#ecc94b'}}>📡 Acquiring GPS...</span>}
      </div>
      <div style={S.body}>
        <p style={{fontSize:'0.75rem',color:'#a08c6a',marginBottom:'0.5rem'}}>Walk to objects in the real world to collect them. Items within 50m are reachable.</p>
        {objects.filter(o => !collected.has(o.id)).map(obj => (
          <div key={obj.id} style={{...S.card, borderLeft: obj.distance <= 50 ? '3px solid #4aaa4a' : '3px solid #3a2a1a'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <span style={{fontSize:'1.2rem',marginRight:'0.4rem'}}>{obj.icon}</span>
                <strong style={{color:'#f5e6c8'}}>{obj.name}</strong>
                <div style={{fontSize:'0.7rem',color:'#a08c6a',marginTop:'0.1rem'}}>⭐{obj.xp}XP 💰{obj.reward} · {obj.bearing}°</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontWeight:700,color:obj.distance<=50?'#4aaa4a':'#a08c6a'}}>{obj.distance}m</div>
                {obj.distance <= 50 && <button onClick={() => collect(obj)} style={{...S.btn,background:'#2a6a2a',color:'#f5e6c8',fontSize:'0.72rem',marginTop:'0.2rem'}}>Collect</button>}
              </div>
            </div>
          </div>
        ))}
        {objects.filter(o => !collected.has(o.id)).length === 0 && <div style={{textAlign:'center',padding:'2rem',color:'#a08c6a'}}>All collected! Move to a new area.</div>}
      </div>
    </div>
  );
}

// === 3D SPACE PANEL (solar system view) ===
export function SpacePanel({ onClose }) {
  const { user } = useAuth();
  const [planets] = useState([
    { name:'Mercury', dist:1, color:'#a0a0a0', size:12, colonized:false, resources:'Iron, Nickel' },
    { name:'Venus', dist:2, color:'#e8a838', size:16, colonized:false, resources:'Carbon, Sulfur' },
    { name:'Earth', dist:3, color:'#4a90d9', size:18, colonized:true, resources:'All basic resources' },
    { name:'Mars', dist:4, color:'#c1440e', size:15, colonized:false, resources:'Iron, Water Ice' },
    { name:'Jupiter', dist:6, color:'#c88b3a', size:30, colonized:false, resources:'Hydrogen, Helium' },
    { name:'Saturn', dist:8, color:'#e8d5a3', size:26, colonized:false, resources:'Hydrogen, Diamonds' },
    { name:'Uranus', dist:10, color:'#7ec8e3', size:20, colonized:false, resources:'Methane, Water' },
    { name:'Neptune', dist:12, color:'#3f51b5', size:19, colonized:false, resources:'Methane, Diamonds' },
  ]);

  return (
    <div style={S.overlay}>
      <div style={{...S.header, background:'linear-gradient(90deg,#1a1a3a,#1a1208)'}}>
        <h2 style={S.title}>🌌 Solar System</h2>
        <button style={S.close} onClick={onClose}>✕</button>
      </div>
      <div style={S.body}>
        <div style={{textAlign:'center',marginBottom:'1rem'}}>
          <div style={{fontSize:'0.75rem',color:'#a08c6a'}}>Your empire spans the cosmos. Expand to new worlds.</div>
          <div style={{fontSize:'0.7rem',color:'#c9a84c',marginTop:'0.3rem'}}>Level {user?.rank || 1} · {user?.xp || 0} XP · 💰{user?.currency || 0}</div>
        </div>
        {/* Solar system visual */}
        <div style={{position:'relative',height:'200px',background:'radial-gradient(circle,#1a1a2e,#0a0a14)',borderRadius:'0.5rem',border:'1px solid #5c4a2a',marginBottom:'1rem',overflow:'hidden'}}>
          {/* Sun */}
          <div style={{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:24,height:24,borderRadius:'50%',background:'radial-gradient(circle,#fff,#fbbf24,#ea580c)',boxShadow:'0 0 20px #fbbf24'}} />
          {/* Planets */}
          {planets.map((p, i) => {
            const angle = (Date.now() / (3000 + i * 1000) + i * 0.8) % (Math.PI * 2);
            const x = 50 + Math.cos(angle) * p.dist * 3.5;
            const y = 50 + Math.sin(angle) * p.dist * 2.5;
            return <div key={p.name} style={{position:'absolute',left:x+'%',top:y+'%',transform:'translate(-50%,-50%)',
              width:p.size,height:p.size,borderRadius:'50%',background:p.color,
              boxShadow:p.colonized?'0 0 8px #4aaa4a':'none',
              border:p.colonized?'2px solid #4aaa4a':'1px solid #333',transition:'all 0.3s'}} title={p.name} />;
          })}
        </div>
        {/* Planet list */}
        {planets.map(p => (
          <div key={p.name} style={{...S.card, borderLeft:`3px solid ${p.color}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
                  <div style={{width:14,height:14,borderRadius:'50%',background:p.color}} />
                  <strong style={{color:'#f5e6c8'}}>{p.name}</strong>
                  {p.colonized && <span style={{fontSize:'0.6rem',color:'#4aaa4a',background:'#1a3a1a',padding:'0.05rem 0.3rem',borderRadius:'1rem'}}>COLONIZED</span>}
                </div>
                <div style={{fontSize:'0.68rem',color:'#a08c6a',marginTop:'0.1rem'}}>Resources: {p.resources}</div>
              </div>
              {!p.colonized && <span style={{fontSize:'0.65rem',color:'#a08c6a'}}>🔒 Requires higher level</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// === AVATAR & IDENTITY PANEL ===
export function AvatarPanel({ onClose }) {
  const { user } = useAuth();
  const [avatar, setAvatar] = useState(null);
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/expansion/avatar').then(r => {
      setAvatar(r.data.avatar);
      setTitles(r.data.allTitles || []);
    }).finally(() => setLoading(false));
  }, []);

  const equip = async (title) => {
    try { await axios.post('/api/expansion/avatar/equip', { title }); setAvatar(prev => ({ ...prev, title })); } catch (e) { }
  };

  const FRAME_COLORS = { basic:'#5c4a2a', silver:'#94a3b8', gold:'#c9a84c' };

  return (
    <div style={S.overlay}>
      <div style={{...S.header, background:'linear-gradient(90deg,#4a2a1a,#1a1208)'}}>
        <h2 style={S.title}>👤 Identity</h2>
        <button style={S.close} onClick={onClose}>✕</button>
      </div>
      <div style={S.body}>
        {loading ? <div style={{textAlign:'center',padding:'2rem',color:'#a08c6a'}}>Loading...</div> : avatar && <>
          <div style={{textAlign:'center',marginBottom:'1rem'}}>
            <div style={{width:70,height:70,borderRadius:'50%',border:`3px solid ${FRAME_COLORS[avatar.frame]||'#5c4a2a'}`,background:'#2a1f10',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 0.5rem',fontSize:'2rem'}}>
              {(user?.email||'?')[0].toUpperCase()}
            </div>
            <div style={{color:'#c9a84c',fontWeight:700,fontSize:'1.1rem',fontStyle:'italic'}}>{avatar.title}</div>
            <div style={{color:'#a08c6a',fontSize:'0.75rem'}}>Reputation: {avatar.reputation} · Contribution: {avatar.contributionScore}</div>
          </div>
          <div style={S.grid}>
            <div style={S.card}><div style={S.label}>Lifetime XP</div><div style={{fontWeight:700,color:'#c9a84c'}}>⭐ {avatar.lifetimeXP}</div></div>
            <div style={S.card}><div style={S.label}>Tasks Done</div><div style={{fontWeight:700,color:'#c9a84c'}}>✅ {avatar.lifetimeTasks}</div></div>
            <div style={S.card}><div style={S.label}>Enemies Slain</div><div style={{fontWeight:700,color:'#c9a84c'}}>💀 {avatar.lifetimeKills}</div></div>
            <div style={S.card}><div style={S.label}>Credits Earned</div><div style={{fontWeight:700,color:'#c9a84c'}}>💰 {avatar.lifetimeCredits}</div></div>
          </div>
          <h3 style={{color:'#c9a84c',fontSize:'0.85rem',marginBottom:'0.5rem'}}>🏅 Titles</h3>
          <div style={{display:'flex',flexWrap:'wrap',gap:'0.3rem'}}>
            {titles.map(t => (
              <button key={t.title} onClick={() => t.unlocked && equip(t.title)} disabled={!t.unlocked}
                style={{...S.btn, background:avatar.title===t.title?'#c9a84c':t.unlocked?'#2a1f10':'#1a1208',
                  color:avatar.title===t.title?'#1a1208':t.unlocked?'#c9a84c':'#3a2a1a',
                  border:`1px solid ${t.unlocked?'#5c4a2a':'#2a1f10'}`,fontSize:'0.7rem',padding:'0.25rem 0.5rem'}}>
                {t.unlocked?'':'🔒'}{t.title}
              </button>
            ))}
          </div>
        </>}
      </div>
    </div>
  );
}

// === CIVILIZATION PROJECTS PANEL ===
export function ProjectsPanel({ onClose }) {
  const [projects, setProjects] = useState([]);
  const [contributing, setContributing] = useState(null);
  const [amount, setAmount] = useState(100);
  const [msg, setMsg] = useState(null);

  useEffect(() => { axios.get('/api/expansion/projects').then(r => setProjects(r.data || [])); }, []);

  const contribute = async (id) => {
    try {
      const r = await axios.post('/api/expansion/projects/' + id + '/contribute', { amount });
      setMsg('Contributed ' + amount + '💰!');
      setProjects(prev => prev.map(p => p.projectId === id ? r.data.project : p));
      setContributing(null);
      setTimeout(() => setMsg(null), 2500);
    } catch (e) { setMsg(e.response?.data?.error || 'Failed'); setTimeout(() => setMsg(null), 2500); }
  };

  const STAGE_NAMES = { 1:'🏠 Local', 2:'🏙️ City', 3:'🏛️ National', 4:'🌍 Global', 5:'🚀 Space' };
  const STAGE_COLORS = { 1:'#4aaa4a', 2:'#4a7acc', 3:'#c9a84c', 4:'#cc6644', 5:'#aa44cc' };

  return (
    <div style={S.overlay}>
      <div style={{...S.header, background:'linear-gradient(90deg,#2a1a3a,#1a1208)'}}>
        <h2 style={S.title}>🌍 Civilization Projects</h2>
        <button style={S.close} onClick={onClose}>✕</button>
      </div>
      {msg && <div style={{padding:'0.4rem',background:'#2a6a2a',color:'#f5e6c8',textAlign:'center',fontWeight:700,fontSize:'0.85rem'}}>{msg}</div>}
      <div style={S.body}>
        <p style={{color:'#a08c6a',fontSize:'0.75rem',marginBottom:'0.75rem'}}>Contribute credits to advance humanity. Rewards distributed to all contributors when complete.</p>
        {[1,2,3,4,5].map(stage => {
          const stageProjects = projects.filter(p => p.stage === stage);
          if (stageProjects.length === 0) return null;
          return (
            <div key={stage} style={{marginBottom:'0.75rem'}}>
              <div style={{color:STAGE_COLORS[stage],fontWeight:700,fontSize:'0.8rem',marginBottom:'0.3rem'}}>{STAGE_NAMES[stage]}</div>
              {stageProjects.map(p => {
                const pct = Math.min(100, Math.round((p.currentAmount / p.goalAmount) * 100));
                return (
                  <div key={p.projectId} style={{...S.card, borderLeft:`3px solid ${STAGE_COLORS[stage]}`, opacity:p.isCompleted?0.6:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div><span style={{fontSize:'1.1rem'}}>{p.icon}</span> <strong style={{color:'#f5e6c8'}}>{p.name}</strong></div>
                      {p.isCompleted ? <span style={{color:'#4aaa4a',fontSize:'0.7rem',fontWeight:700}}>✅ DONE</span> :
                        <button onClick={() => setContributing(contributing===p.projectId?null:p.projectId)} style={{...S.btn,background:STAGE_COLORS[stage],color:'#1a1208',fontSize:'0.7rem'}}>Contribute</button>}
                    </div>
                    <div style={{fontSize:'0.7rem',color:'#a08c6a',margin:'0.2rem 0'}}>{p.description}</div>
                    <div style={{height:6,background:'#1a1208',borderRadius:3,overflow:'hidden',marginTop:'0.3rem'}}>
                      <div style={{height:'100%',width:pct+'%',background:STAGE_COLORS[stage],borderRadius:3,transition:'width 0.3s'}} />
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.65rem',color:'#a08c6a',marginTop:'0.15rem'}}>
                      <span>{p.currentAmount.toLocaleString()} / {p.goalAmount.toLocaleString()} ({pct}%)</span>
                      <span>Reward: ⭐{p.rewardXP} 💰{p.rewardCurrency}</span>
                    </div>
                    {contributing===p.projectId && (
                      <div style={{display:'flex',gap:'0.3rem',marginTop:'0.3rem',alignItems:'center'}}>
                        <input type="number" value={amount} onChange={e=>setAmount(Math.max(1,parseInt(e.target.value)||0))} min="1"
                          style={{width:80,padding:'0.25rem',background:'#1a1208',border:'1px solid #5c4a2a',borderRadius:'0.2rem',color:'#f5e6c8',fontSize:'0.8rem'}} />
                        <button onClick={() => contribute(p.projectId)} style={{...S.btn,background:'#4aaa4a',color:'#1a1208',fontSize:'0.72rem'}}>💰 Send</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// === GUILDS PANEL ===
export function GuildsPanel({ onClose }) {
  const [guilds, setGuilds] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name:'', specialization:'builders', description:'' });

  useEffect(() => { axios.get('/api/expansion/guilds').then(r => setGuilds(r.data || [])); }, []);

  const join = async (id) => {
    try { await axios.post('/api/expansion/guilds/' + id + '/join'); alert('Joined!'); axios.get('/api/expansion/guilds').then(r => setGuilds(r.data || [])); } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const create = async () => {
    try { await axios.post('/api/expansion/guilds', form); setCreating(false); axios.get('/api/expansion/guilds').then(r => setGuilds(r.data || [])); } catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const SPEC_ICONS = { builders:'🏗️', scientists:'🔬', warriors:'⚔️', healers:'💚', traders:'💰', explorers:'🧭', creators:'🎨', leaders:'👑' };

  return (
    <div style={S.overlay}>
      <div style={{...S.header, background:'linear-gradient(90deg,#1a2a3a,#1a1208)'}}>
        <h2 style={S.title}>⚔️ Guilds</h2>
        <div style={{display:'flex',gap:'0.3rem'}}>
          <button onClick={() => setCreating(!creating)} style={{...S.btn,background:'#c9a84c',color:'#1a1208',fontSize:'0.72rem'}}>{creating?'Cancel':'+ Create'}</button>
          <button style={S.close} onClick={onClose}>✕</button>
        </div>
      </div>
      <div style={S.body}>
        {creating && (
          <div style={{...S.card, marginBottom:'0.75rem', borderColor:'#c9a84c'}}>
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Guild name"
              style={{width:'100%',padding:'0.35rem',background:'#1a1208',border:'1px solid #5c4a2a',borderRadius:'0.2rem',color:'#f5e6c8',marginBottom:'0.3rem',boxSizing:'border-box'}} />
            <select value={form.specialization} onChange={e=>setForm({...form,specialization:e.target.value})}
              style={{width:'100%',padding:'0.35rem',background:'#1a1208',border:'1px solid #5c4a2a',borderRadius:'0.2rem',color:'#f5e6c8',marginBottom:'0.3rem'}}>
              {Object.entries(SPEC_ICONS).map(([k,v]) => <option key={k} value={k}>{v} {k}</option>)}
            </select>
            <button onClick={create} style={{...S.btn,background:'#c9a84c',color:'#1a1208',width:'100%'}}>Create (100 IP)</button>
          </div>
        )}
        {guilds.map(g => (
          <div key={g._id} style={S.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <span style={{fontSize:'1.2rem'}}>{g.icon}</span>
                <strong style={{color:'#f5e6c8',marginLeft:'0.3rem'}}>{g.name}</strong>
                <span style={{fontSize:'0.65rem',color:'#a08c6a',marginLeft:'0.4rem'}}>Lv.{g.level} · {g.memberCount}/{g.maxMembers} · +{Math.round((g.bonusMultiplier-1)*100)}% bonus</span>
              </div>
              <button onClick={() => join(g._id)} style={{...S.btn,background:'#2a6a2a',color:'#f5e6c8',fontSize:'0.7rem'}}>Join</button>
            </div>
            {g.description && <div style={{fontSize:'0.7rem',color:'#a08c6a',marginTop:'0.15rem'}}>{g.description}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// === NODES PANEL (CoreNode System) ===
export function NodesPanel({ onClose }) {
  const [nodes, setNodes] = useState([]);
  const [onlineNodes, setOnlineNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('mine');
  const [msg, setMsg] = useState(null);

  const load = () => {
    Promise.all([axios.get('/api/nodes/mine'), axios.get('/api/nodes/online')])
      .then(([m, o]) => { setNodes(m.data || []); setOnlineNodes(o.data || []); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const registerNode = async () => {
    try {
      const caps = ['compute', 'display', 'storage'];
      if (navigator.geolocation) caps.push('gps');
      if (navigator.mediaDevices) caps.push('camera', 'audio');
      const r = await axios.post('/api/nodes/register', {
        name: 'Browser Node ' + Math.random().toString(36).slice(-4).toUpperCase(),
        type: 'browser',
        capabilities: caps,
        metadata: { userAgent: navigator.userAgent, platform: navigator.platform, screenRes: window.screen.width + 'x' + window.screen.height }
      });
      setMsg({ text: '✅ Node registered: ' + r.data.name, type: 'success' });
      load();
      setTimeout(() => setMsg(null), 3000);
    } catch (e) { setMsg({ text: e.response?.data?.error || 'Failed', type: 'error' }); setTimeout(() => setMsg(null), 3000); }
  };

  const deleteNode = async (nodeId) => {
    try { await axios.delete('/api/nodes/' + nodeId); load(); } catch (e) { alert('Failed'); }
  };

  const STATUS_COLORS = { online: '#4aaa4a', offline: '#6a3a3a', idle: '#c9a84c', busy: '#cc4a4a' };
  const TYPE_ICONS = { browser: '🌐', desktop: '🖥️', mobile: '📱', server: '🖧', iot: '📡' };

  return (
    <div style={S.overlay}>
      <div style={{...S.header, background: 'linear-gradient(90deg,#0a2a3a,#1a1208)'}}>
        <h2 style={S.title}>🖥️ Nodes ({nodes.length})</h2>
        <div style={{display:'flex',gap:'0.3rem'}}>
          <button onClick={registerNode} style={{...S.btn,background:'#c9a84c',color:'#1a1208',fontSize:'0.72rem'}}>+ Register</button>
          <button style={S.close} onClick={onClose}>✕</button>
        </div>
      </div>
      {msg && <div style={{padding:'0.4rem',background:msg.type==='success'?'#2a6a2a':'#6a2a2a',color:'#f5e6c8',textAlign:'center',fontWeight:700,fontSize:'0.85rem'}}>{msg.text}</div>}
      <div style={{display:'flex',gap:'0.2rem',padding:'0.3rem',background:'#0a0804',borderBottom:'1px solid #5c4a2a'}}>
        {[['mine','🖥️','My Nodes'],['network','🌐','Network']].map(([id,icon,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{...S.btn,flex:1,background:tab===id?'#5c4a2a':'#1a1208',color:tab===id?'#c9a84c':'#a08c6a',fontSize:'0.72rem',padding:'0.3rem',border:tab===id?'1px solid #c9a84c':'1px solid #3a2a1a'}}>
            {icon} {label}
          </button>
        ))}
      </div>
      <div style={S.body}>
        {loading ? <div style={{textAlign:'center',padding:'2rem',color:'#a08c6a'}}>Loading nodes...</div> :
        tab === 'mine' ? (
          nodes.length === 0 ? <div style={{textAlign:'center',padding:'2rem',color:'#a08c6a'}}>No nodes registered. Click "+ Register" to add this device.</div> :
          nodes.map(n => (
            <div key={n.nodeId} style={{...S.card, borderLeft: '3px solid ' + (STATUS_COLORS[n.status] || '#5c4a2a')}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <span style={{fontSize:'1.1rem'}}>{TYPE_ICONS[n.type] || '🖥️'}</span>
                  <strong style={{color:'#f5e6c8',marginLeft:'0.3rem'}}>{n.name}</strong>
                  <span style={{fontSize:'0.6rem',color:STATUS_COLORS[n.status],marginLeft:'0.3rem',fontWeight:700}}>● {n.status}</span>
                </div>
                <button onClick={() => deleteNode(n.nodeId)} style={{...S.btn,background:'#4a1a1a',color:'#fc8181',fontSize:'0.65rem',padding:'0.2rem 0.4rem'}}>✕</button>
              </div>
              <div style={{fontSize:'0.62rem',color:'#a08c6a',marginTop:'0.2rem'}}>
                Caps: {(n.capabilities||[]).join(', ')} · Tasks: {n.stats?.tasksExecuted||0} · Plugins: {(n.installedPlugins||[]).length}
              </div>
              <div style={{fontSize:'0.58rem',color:'#5c4a2a',marginTop:'0.1rem'}}>ID: {n.nodeId}</div>
            </div>
          ))
        ) : (
          <div>
            <p style={{color:'#a08c6a',fontSize:'0.75rem',marginBottom:'0.5rem'}}>Online nodes in the network ({onlineNodes.length})</p>
            {onlineNodes.map(n => (
              <div key={n.nodeId} style={S.card}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <span>{TYPE_ICONS[n.type]||'🖥️'}</span>
                    <strong style={{color:'#f5e6c8',marginLeft:'0.3rem',fontSize:'0.82rem'}}>{n.name}</strong>
                    <span style={{fontSize:'0.6rem',color:'#4aaa4a',marginLeft:'0.3rem'}}>● online</span>
                  </div>
                  <span style={{fontSize:'0.65rem',color:'#a08c6a'}}>{(n.capabilities||[]).length} caps</span>
                </div>
                <div style={{fontSize:'0.6rem',color:'#5c4a2a'}}>Owner: {n.userId?.email?.split('@')[0] || '?'} · Rank {n.userId?.rank||1}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// === PLUGINS PANEL (Marketplace) ===
export function PluginsPanel({ onClose }) {
  const [plugins, setPlugins] = useState([]);
  const [myNodes, setMyNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [msg, setMsg] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    Promise.all([axios.get('/api/plugins/marketplace'), axios.get('/api/nodes/mine')])
      .then(([p, n]) => { setPlugins(p.data || []); setMyNodes(n.data || []); if (n.data?.length) setSelectedNode(n.data[0].nodeId); })
      .finally(() => setLoading(false));
  }, []);

  const install = async (pluginId) => {
    if (!selectedNode) { setMsg({text:'Register a node first!',type:'error'}); setTimeout(()=>setMsg(null),3000); return; }
    try {
      const r = await axios.post('/api/plugins/' + pluginId + '/install/' + selectedNode);
      setMsg({text:'✅ ' + r.data.message, type:'success'});
      setTimeout(()=>setMsg(null),3000);
    } catch (e) { setMsg({text:e.response?.data?.error||'Install failed',type:'error'}); setTimeout(()=>setMsg(null),3000); }
  };

  const CAT_ICONS = { utility:'🔧', productivity:'📋', social:'👥', game:'🎮', storage:'💾', compute:'⚡', communication:'💬', security:'🛡️', analytics:'📊' };
  const system = plugins.filter(p => p.isSystem);
  const community = plugins.filter(p => !p.isSystem);
  const shown = tab === 'system' ? system : tab === 'community' ? community : plugins;

  return (
    <div style={S.overlay}>
      <div style={{...S.header, background: 'linear-gradient(90deg,#2a0a3a,#1a1208)'}}>
        <h2 style={S.title}>🔌 Plugins ({plugins.length})</h2>
        <button style={S.close} onClick={onClose}>✕</button>
      </div>
      {msg && <div style={{padding:'0.4rem',background:msg.type==='success'?'#2a6a2a':'#6a2a2a',color:'#f5e6c8',textAlign:'center',fontWeight:700,fontSize:'0.85rem'}}>{msg.text}</div>}

      {myNodes.length > 0 && (
        <div style={{padding:'0.3rem 0.5rem',background:'#0a0804',borderBottom:'1px solid #3a2a1a',fontSize:'0.7rem',color:'#a08c6a'}}>
          Install to: <select value={selectedNode||''} onChange={e=>setSelectedNode(e.target.value)}
            style={{background:'#1a1208',border:'1px solid #5c4a2a',color:'#c9a84c',padding:'0.15rem',borderRadius:'0.2rem',fontSize:'0.7rem'}}>
            {myNodes.map(n => <option key={n.nodeId} value={n.nodeId}>{n.name}</option>)}
          </select>
        </div>
      )}

      <div style={{display:'flex',gap:'0.2rem',padding:'0.3rem',background:'#0a0804',borderBottom:'1px solid #5c4a2a'}}>
        {[['all','📦','All'],['system','⚙️','System'],['community','🌍','Community']].map(([id,icon,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{...S.btn,flex:1,background:tab===id?'#5c4a2a':'#1a1208',color:tab===id?'#c9a84c':'#a08c6a',fontSize:'0.72rem',padding:'0.3rem',border:tab===id?'1px solid #c9a84c':'1px solid #3a2a1a'}}>
            {icon} {label}
          </button>
        ))}
      </div>
      <div style={S.body}>
        {loading ? <div style={{textAlign:'center',padding:'2rem',color:'#a08c6a'}}>Loading plugins...</div> :
        shown.map(p => (
          <div key={p.pluginId} style={{...S.card, borderLeft: p.isSystem ? '3px solid #4a7acc' : p.isPaid ? '3px solid #c9a84c' : '3px solid #5c4a2a'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{flex:1}}>
                <span style={{fontSize:'1.2rem'}}>{p.icon}</span>
                <strong style={{color:'#f5e6c8',marginLeft:'0.3rem'}}>{p.name}</strong>
                {p.isSystem && <span style={{fontSize:'0.55rem',background:'#4a7acc',color:'#fff',padding:'0.1rem 0.3rem',borderRadius:'0.15rem',marginLeft:'0.3rem'}}>SYSTEM</span>}
                {p.isVerified && <span style={{fontSize:'0.55rem',color:'#4aaa4a',marginLeft:'0.2rem'}}>✓</span>}
                <div style={{fontSize:'0.68rem',color:'#a08c6a',marginTop:'0.1rem'}}>{p.description}</div>
                <div style={{fontSize:'0.58rem',color:'#5c4a2a',marginTop:'0.1rem'}}>
                  {CAT_ICONS[p.category]||'📦'} {p.category} · ⬇{p.downloads||0}
                  {p.rating > 0 && ' · ⭐' + p.rating}
                  {p.permissions?.length > 0 && ' · 🔑' + p.permissions.join(',')}
                </div>
              </div>
              <button onClick={() => install(p.pluginId)} style={{...S.btn,background:p.isPaid?'#c9a84c':'#2a6a2a',color:p.isPaid?'#1a1208':'#f5e6c8',fontSize:'0.72rem'}}>
                {p.isPaid ? '💰' + p.price : 'Install'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// === ACTIVITY FEED PANEL — Real-time world events ===
export function ActivityFeedPanel({ onClose }) {
  const [feed, setFeed] = useState([]);
  const [liveFeed, setLiveFeed] = useState([]);
  const [tab, setTab] = useState('live');
  const [loading, setLoading] = useState(true);
  const [worldState, setWorldState] = useState(null);

  useEffect(() => {
    // Load historical feed
    axios.get('/api/feed/global').then(r => setFeed(r.data || [])).finally(() => setLoading(false));
    // Load world state
    axios.get('/api/world/state').then(r => setWorldState(r.data)).catch(() => {});
  }, []);

  const TYPE_ICONS = {
    task_complete:'✅', level_up:'🎉', achievement:'🏆', plugin_install:'🔌',
    node_register:'🖥️', structure_build:'🏗️', research_complete:'🔬',
    join_alliance:'🤝', streak_milestone:'🔥', purchase:'💰', challenge_win:'⚔️',
    friend_add:'👥', guild_join:'⚔️', system:'📢', world_event:'⚡', civ_levelup:'🏆'
  };

  const TYPE_COLORS = {
    task_complete:'#10b981', level_up:'#f59e0b', achievement:'#f59e0b',
    world_event:'#ef4444', civ_levelup:'#c9a84c', streak_milestone:'#f97316',
    research_complete:'#3b82f6', structure_build:'#8b5cf6',
  };

  const timeAgo = (d) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return s + 's ago';
    if (s < 3600) return Math.floor(s/60) + 'm ago';
    if (s < 86400) return Math.floor(s/3600) + 'h ago';
    return Math.floor(s/86400) + 'd ago';
  };

  const allFeed = tab === 'live'
    ? [...liveFeed, ...feed.slice(0, 20)]
    : feed;

  return (
    <div style={S.overlay}>
      <div style={{...S.header, background:'linear-gradient(90deg,#1a3a1a,#1a1208)'}}>
        <h2 style={S.title}>📡 World Feed</h2>
        <button style={S.close} onClick={onClose}>✕</button>
      </div>

      {/* World state bar */}
      {worldState && (
        <div style={{padding:'0.4rem 0.75rem',background:'#0a0804',borderBottom:'1px solid #5c4a2a',display:'flex',gap:'0.75rem',fontSize:'0.68rem',flexWrap:'wrap'}}>
          <span style={{color:'#c9a84c'}}>🏆 Civ Lv.{worldState.civilizationLevel}</span>
          <span style={{color:'#10b981'}}>🌐 {worldState.playerCount||0} online</span>
          <span style={{color:'#3b82f6'}}>📚 {(worldState.globalResources?.knowledge||0).toLocaleString()} knowledge</span>
          <span style={{color:'#f59e0b'}}>⚡ {(worldState.globalResources?.energy||0).toLocaleString()} energy</span>
          {worldState.activeEvents?.length > 0 && (
            <span style={{color:'#ef4444',fontWeight:700}}>⚡ {worldState.activeEvents[0].name}</span>
          )}
        </div>
      )}

      <div style={{display:'flex',gap:'0.2rem',padding:'0.3rem',background:'#0a0804',borderBottom:'1px solid #5c4a2a'}}>
        {[['live','⚡ Live'],['history','📜 History']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{...S.btn,flex:1,background:tab===id?'#5c4a2a':'#1a1208',color:tab===id?'#c9a84c':'#a08c6a',fontSize:'0.72rem',padding:'0.3rem',border:tab===id?'1px solid #c9a84c':'1px solid #3a2a1a'}}>
            {label}
          </button>
        ))}
      </div>

      <div style={S.body}>
        {loading && tab==='history' ? (
          <div style={{textAlign:'center',padding:'2rem',color:'#a08c6a'}}>Loading feed...</div>
        ) : allFeed.length === 0 ? (
          <div style={{textAlign:'center',padding:'2rem',color:'#a08c6a'}}>
            <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>📡</div>
            No activity yet. Complete tasks to appear here!
          </div>
        ) : allFeed.map((a, i) => {
          const col = TYPE_COLORS[a.type] || '#5c4a2a';
          return (
            <div key={a._id || a.timestamp || i} style={{...S.card, borderLeft:`3px solid ${col}`, padding:'0.5rem', marginBottom:'0.3rem'}}>
              <div style={{display:'flex',gap:'0.4rem',alignItems:'flex-start'}}>
                <span style={{fontSize:'1.1rem'}}>{TYPE_ICONS[a.type] || '📌'}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:'0.8rem',color:'#f5e6c8',lineHeight:1.3}}>{a.message}</div>
                  <div style={{display:'flex',gap:'0.5rem',fontSize:'0.6rem',color:'#5c4a2a',marginTop:'0.1rem',flexWrap:'wrap'}}>
                    <span>{a.userId?.email?.split('@')[0] || a.email?.split('@')[0] || 'System'}</span>
                    {a.xp && <span style={{color:'#fbbf24'}}>+{a.xp}XP</span>}
                    {a.aiVerified && <span style={{color:'#6366f1'}}>🤖 AI</span>}
                    <span>{timeAgo(a.createdAt || a.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
